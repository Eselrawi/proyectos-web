# Mi Semana

Agenda semanal para el móvil. Escribes en una frase lo que tienes que hacer ("mañana a las 10 dentista") y la app entiende el día y la hora. Lo que no te da tiempo a hacer se pasa a mañana con un gesto.

> APK para Android: [Releases](https://github.com/Eselrawi/proyectos-web/releases/latest), archivo `MiSemana.apk`

## Qué incluye

- Entrada rápida en lenguaje natural: "el viernes comprar pan", "pasado mañana llamar a mamá a las 5", "el 20/10 cumple de Ana", "en 3 días…", "la semana que viene…". Antes de añadir la tarea se ve para qué día y hora va a quedar.
- Gestos: desliza a la derecha para marcar como hecha y a la izquierda para pasarla a mañana. Cada tarea muestra cuántas veces se ha aplazado.
- Las tareas sin hacer de días anteriores aparecen arriba en *Hoy*, con un botón para moverlas todas a hoy.
- Vista de día con anillo de progreso y vista de semana. Cada día tiene su color.
- Emoji automático según la tarea (médico, compra, gimnasio…).
- Avisos en Android: resumen por la mañana, pendientes por la noche y plan del día siguiente, con la hora de cada uno ajustable.
- Modo claro y oscuro, y botón de deshacer.
- Todo se guarda en el propio móvil. No hay cuentas ni servidor, y funciona sin conexión.

## Tecnologías

- HTML, CSS y JavaScript sin frameworks ni paso de compilación
- Capacitor 8 para empaquetar la app de Android
- Plugins de Capacitor: notificaciones locales, vibración y botón atrás
- GitHub Actions para compilar y publicar la APK
- Python y Pillow para generar los iconos

## Cómo ejecutarlo

En el navegador:

```bash
npm run dev       # sirve www/ en local
```

App de Android (hace falta el SDK de Android y JDK 21):

```bash
npm install
npm run android
cd android && ./gradlew assembleDebug
```

Cada cambio en esta carpeta que llega a `main` compila la APK con GitHub Actions (`.github/workflows/mi-semana-apk.yml`) y la publica en Releases.

En iPhone se puede usar la versión web: abre `www/` servida por HTTPS en Safari y pulsa Compartir → *Añadir a pantalla de inicio*.

## Firma de la APK

Si el repositorio no tiene los secretos `ANDROID_KEYSTORE_BASE64` y `ANDROID_KEYSTORE_PASSWORD`, cada compilación se firma con una clave temporal. En ese caso, para instalar una versión nueva hay que desinstalar antes la anterior, y se pierden las tareas guardadas. Con una clave fija (alias `misemana`) las actualizaciones se instalan encima.

## Estructura

```
www/index.html           Estructura de la app
www/app.js               Lógica: analizador de frases, gestos, vistas y avisos
www/styles.css           Estilos y temas claro/oscuro
www/sw.js                Service worker para la versión web sin conexión
assets/                  Iconos y pantalla de carga para Android
tools/build_icons.py     Genera todos los iconos
capacitor.config.json    Configuración de Capacitor
```

## Autor

Raúl Gómez ([@Eselrawi](https://github.com/Eselrawi)). Desarrollado con ayuda de Claude Code.
