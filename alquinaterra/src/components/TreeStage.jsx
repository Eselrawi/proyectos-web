import { useEffect, useRef } from 'react'
import { useScroll, useMotionValueEvent } from 'motion/react'

// Turntable del árbol: 120 fotogramas reales (Blender/Cycles) pintados en un <canvas>
// según el progreso de scroll de toda la página. Nada de WebGL en tiempo real: solo
// decodificar y dibujar la imagen que toca, así que es barato y va fino en móvil.
const DESKTOP = import.meta.glob('../assets/tree-frames/desktop/*.webp', { eager: false, query: '?url', import: 'default' })
const MOBILE = import.meta.glob('../assets/tree-frames/mobile/*.webp', { eager: false, query: '?url', import: 'default' })

function sortedLoaders(glob) {
  return Object.keys(glob).sort().map((k) => glob[k])
}

const DESKTOP_LOADERS = sortedLoaders(DESKTOP)
const MOBILE_LOADERS = sortedLoaders(MOBILE)

function isMobileViewport() {
  return window.matchMedia('(max-width: 899px)').matches
}

export default function TreeStage() {
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const onScrollRef = useRef(() => {})
  const { scrollYProgress } = useScroll()

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    const ctx = canvas.getContext('2d')
    let destroyed = false

    const loaders = isMobileViewport() ? MOBILE_LOADERS : DESKTOP_LOADERS
    const count = loaders.length
    const images = new Array(count)
    let loadedUpTo = -1 // índice contiguo más alto ya cargado desde el principio
    let lastDrawn = -1

    function currentIndex() {
      const v = Math.max(0, Math.min(1, scrollYProgress.get()))
      const idx = Math.round(v * (count - 1))
      return Math.min(idx, Math.max(loadedUpTo, 0))
    }

    function draw(force) {
      const index = currentIndex()
      if (!force && index === lastDrawn) return
      const img = images[index]
      if (!img) return
      lastDrawn = index
      const cw = canvas.width
      const ch = canvas.height
      const scale = Math.max(cw / img.width, ch / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      ctx.clearRect(0, 0, cw, ch)
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
      if (index === 0) stage.classList.add('is-ready')
    }

    onScrollRef.current = () => draw(false)

    function resize() {
      const w = stage.clientWidth
      const h = stage.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      draw(true)
    }

    // precarga progresiva: en orden, una a una, sin bloquear el hilo principal
    function preload(i) {
      if (destroyed || i >= count) return
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        images[i] = img
        if (i === loadedUpTo + 1) {
          loadedUpTo = i
          while (images[loadedUpTo + 1]) loadedUpTo++
        }
        if (i === 0 || i === currentIndex()) draw(true)
        const next = () => preload(i + 1)
        'requestIdleCallback' in window ? requestIdleCallback(next, { timeout: 200 }) : setTimeout(next, 16)
      }
      img.onerror = () => {
        const next = () => preload(i + 1)
        'requestIdleCallback' in window ? requestIdleCallback(next, { timeout: 200 }) : setTimeout(next, 16)
      }
      loaders[i]().then((url) => { img.src = url })
    }
    preload(0)

    const ro = new ResizeObserver(resize)
    ro.observe(stage)
    resize()

    return () => {
      destroyed = true
      ro.disconnect()
      onScrollRef.current = () => {}
    }
  }, [scrollYProgress])

  useMotionValueEvent(scrollYProgress, 'change', () => onScrollRef.current())

  return (
    <div ref={stageRef} className="tree-stage">
      <canvas ref={canvasRef} className="tree-canvas" aria-hidden="true" />
    </div>
  )
}
