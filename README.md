# Proyectos web

Soy Raúl Gómez, desarrollador web junior. Aquí están los proyectos que tengo publicados. Cada uno tiene su demo o descarga y su propia carpeta con el código.

| Proyecto | Demo | Código |
| --- | --- | --- |
| Lumbre Errante, carta de restaurante en 3D | [restaurante-azure-ten.vercel.app](https://restaurante-azure-ten.vercel.app) | [`restaurante/`](restaurante) |
| Alquinaterra, web de herbolario | [alquinaterra-web.vercel.app](https://alquinaterra-web.vercel.app) | [`alquinaterra/`](alquinaterra) |
| Mi Semana, agenda semanal para el móvil | [APK para Android](https://github.com/Eselrawi/proyectos-web/releases/latest) | [`mi-semana/`](mi-semana) |

## Lumbre Errante

**[Ver la demo](https://restaurante-azure-ten.vercel.app)**

Web de un restaurante ficticio para enseñar qué se puede hacer con una carta digital. Cada plato se ve desde arriba, en relieve, y al tocar un ingrediente aparece qué es, de qué está hecha la salsa y sus alérgenos. Los pedidos llegan a un panel de cocina.

- Carta con platos en relieve 3D, generados a partir de fotos con mapas de profundidad.
- Cesta, pedidos, reservas y panel de cocina.
- Códigos QR por mesa.
- Modo demo: los datos se borran a las 24 horas y no se envía ningún email real.

Tecnologías: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Three.js (React Three Fiber), Motion, GSAP, Zustand, Zod y Vitest.

Todo el contenido es inventado. Las fotos son de Wikimedia Commons, con sus créditos en la propia web.

## Alquinaterra

**[Ver la demo](https://alquinaterra-web.vercel.app)**

Maqueta de web para un herbolario. Un árbol fotorrealista ocupa el fondo y gira 360° mientras haces scroll. Encima van seis paradas con tarjetas fijas: portada, categorías de producto, reseñas, horario y contacto.

- El árbol no es 3D en tiempo real. Son 120 fotogramas renderizados con Blender que un `<canvas>` va pintando según el scroll.
- Fotogramas en WebP, con un juego más ligero para móvil.
- Modo claro y oscuro.

Tecnologías: React 19, Vite, GSAP con ScrollTrigger, Lenis, Motion y Blender.

Los datos del negocio (teléfono, dirección, valoraciones) son de ejemplo.

## Mi Semana

**[Descargar la APK](https://github.com/Eselrawi/proyectos-web/releases/latest)**

Agenda semanal para el móvil. Escribes en una frase lo que tienes que hacer ("mañana a las 10 dentista") y la app entiende el día y la hora. Lo que no te da tiempo a hacer se pasa a mañana deslizando la tarea.

- Entrada rápida en lenguaje natural, con vista previa del día y la hora antes de añadir.
- Deslizar para marcar como hecha o aplazar. Las tareas atrasadas aparecen en *Hoy*.
- Vista de día y de semana, un color por día y modo claro y oscuro.
- Avisos en Android: resumen por la mañana, pendientes por la noche y plan del día siguiente.
- Todo se guarda en el móvil, sin cuentas ni servidor.

Tecnologías: HTML, CSS y JavaScript sin frameworks, Capacitor 8 (Android) y GitHub Actions para compilar la APK.

## Ejecutar un proyecto

Cada carpeta es independiente. Por ejemplo:

```bash
cd alquinaterra
npm install
npm run dev
```

El restaurante necesita además copiar `.env.example` a `.env.local`. Mi Semana se prueba en el navegador con `npm run dev` y su APK la compila GitHub Actions. Las instrucciones de cada uno están en su README.

## Autor

Raúl Gómez · [@Eselrawi](https://github.com/Eselrawi)

Desarrollado con ayuda de Claude Code.
