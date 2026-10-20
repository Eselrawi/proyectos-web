# Alquinaterra

Maqueta de web para un herbolario. La página es un scroll largo con un árbol de fondo que gira 360° mientras bajas, y encima unas tarjetas fijas con la información del negocio.

> Demo: https://alquinaterra-web.vercel.app

## Qué incluye

- Árbol fotorrealista como fondo fijo. No es 3D en tiempo real: son 120 fotogramas renderizados con Blender, y un `<canvas>` pinta el que toca según el progreso del scroll.
- Dos juegos de fotogramas en WebP: 1600 px para escritorio y 800 px para móvil. Se precargan en segundo plano, así que nunca se ve el canvas en blanco.
- Seis paradas con tarjeta fija: portada, categorías de producto, reseñas, horario y contacto.
- Scroll suave y animaciones ligadas al scroll.
- Modo claro y oscuro.
- Metadatos Open Graph y JSON-LD para buscadores.

Los datos del negocio (teléfono, dirección, Instagram, valoraciones) son de ejemplo. Los textos están en `src/data/business.js`. Las tres fotos de la galería son de Unsplash y solo sirven de relleno.

## Tecnologías

- React 19
- Vite 6
- GSAP y ScrollTrigger
- Lenis (scroll suave)
- Motion (`useScroll`, para mover el árbol)
- Blender (Cycles) y `sharp` para generar los fotogramas

## Cómo ejecutarlo

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # genera dist/
npm run preview   # sirve dist/ en local
```

## Regenerar el árbol

Hace falta Blender y el modelo original (Island Tree 01, de Poly Haven), que no está en este repositorio por su tamaño. Con el `.blend` descargado en `assets/modelos/`:

```bash
blender -b assets/modelos/island_tree_01_1k.blend -P tools/blender/render_turntable.py -- --out assets/renders/frames --frames 120 --res 1600 --samples 64
node tools/build_frames.mjs
```

El segundo comando convierte los PNG en los WebP de `src/assets/tree-frames/`.

## Estructura

```
src/data/business.js          Datos y textos del negocio
src/components/TreeStage.jsx  Canvas del árbol según el scroll
src/components/Sections.jsx   Contenido de cada parada
src/assets/tree-frames/       Fotogramas WebP (desktop y mobile)
tools/blender/                Script de render del turntable
tools/build_frames.mjs        PNG a WebP
```

## Créditos

Modelo del árbol: Island Tree 01, de Poly Haven (CC0). Más detalle en `CREDITS.md`.

## Autor

Raúl Gómez ([@Eselrawi](https://github.com/Eselrawi)). Desarrollado con ayuda de Claude Code.
