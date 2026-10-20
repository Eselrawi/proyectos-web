// Fase 3: fotogramas del árbol (PNG de Blender) -> WebP, escritorio (1600px) y móvil (800px).
// Si el total en móvil pasa de ~8MB, reduce el número de fotogramas móviles (coge 1 de cada 2).
import sharp from 'sharp'
import { readdir, mkdir, stat, rm } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'assets/renders/frames')
const OUT_DESKTOP = path.join(ROOT, 'src/assets/tree-frames/desktop')
const OUT_MOBILE = path.join(ROOT, 'src/assets/tree-frames/mobile')
const MOBILE_BUDGET = 8 * 1024 * 1024
const QUALITY = 80

async function listFrames() {
  const files = (await readdir(SRC)).filter((f) => /^frame_\d{4}\.png$/.test(f)).sort()
  if (!files.length) throw new Error(`No hay fotogramas PNG en ${SRC}`)
  return files
}

async function encodeSet(files, outDir, width) {
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })
  let total = 0
  for (let i = 0; i < files.length; i++) {
    const outFile = path.join(outDir, `frame_${String(i).padStart(4, '0')}.webp`)
    await sharp(path.join(SRC, files[i]))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: QUALITY, alphaQuality: 90 })
      .toFile(outFile)
    total += (await stat(outFile)).size
  }
  return total
}

const files = await listFrames()
console.log(`${files.length} fotogramas de origen en ${SRC}`)

const desktopTotal = await encodeSet(files, OUT_DESKTOP, 1600)
console.log(`Escritorio: ${files.length} frames, ${(desktopTotal / 1024 / 1024).toFixed(2)} MB`)

let mobileFiles = files
let mobileTotal = await encodeSet(mobileFiles, OUT_MOBILE, 800)
console.log(`Móvil (${mobileFiles.length} frames): ${(mobileTotal / 1024 / 1024).toFixed(2)} MB`)

if (mobileTotal > MOBILE_BUDGET && mobileFiles.length > 60) {
  const target = 60
  const step = mobileFiles.length / target
  mobileFiles = Array.from({ length: target }, (_, i) => mobileFiles[Math.round(i * step)] ?? mobileFiles.at(-1))
  mobileTotal = await encodeSet(mobileFiles, OUT_MOBILE, 800)
  console.log(`Móvil reducido a ${mobileFiles.length} frames: ${(mobileTotal / 1024 / 1024).toFixed(2)} MB`)
}

console.log(`\nTotal: ${((desktopTotal + mobileTotal) / 1024 / 1024).toFixed(2)} MB`)
