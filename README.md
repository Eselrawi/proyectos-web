# Proyectos web

Soy Raúl Gómez, desarrollador web junior. Aquí tienes los proyectos web que tengo publicados. Puedes entrar y probarlos desde el enlace de cada uno.

## Lumbre Errante

**[Probar la demo](https://restaurante-azure-ten.vercel.app)**

Carta digital en 3D para restaurantes. Cada plato se ve desde arriba, en relieve, y al tocar un ingrediente aparece qué es, de qué está hecha la salsa y sus alérgenos. Del pedido en la mesa a la cocina, todo en una misma web y sin instalar nada.

| Para el cliente | Para el restaurante |
| --- | --- |
| Platos en relieve 3D con lectura del ingrediente que tocas | Pantalla de cocina con comandas en grande, aviso sonoro y pantalla completa |
| Cesta con comentario por plato («sin cebolla») | Sala: mesas, pedidos listos y reservas de hoy |
| QR por mesa: el pedido llega ya asignado a su mesa | Recepción con las reservas y la cuenta de cada mesa |
| Cuenta con todas las rondas y petición de la cuenta en efectivo o tarjeta | Encargado: ventas, platos más pedidos y estadísticas |
| Reserva de mesa desde el móvil | Precios, platos agotados y promociones por horas editables al momento |
| Portada con versión móvil propia, pensada para el dedo | Carta editable sin tocar código, con alérgenos por plato |

Pensada para enseñarla: es un restaurante inventado, los pedidos y reservas se borran solos a las 24 horas y no se envía ningún email real.

Tecnología: Next.js, React, TypeScript, Tailwind, Three.js, Motion, Zustand, Zod, Vitest y Vercel.

## PalaReserva

**[Probar la demo](https://palareserva.vercel.app)**

Reservas de pistas de pádel para clubes pequeños y de pueblo. El jugador reserva desde el móvil en pocos toques, sin cuenta ni contraseña, y el club lo gestiona todo desde su panel. Cuota fija, sin comisión por reserva.

| Para el jugador | Para el club |
| --- | --- |
| Reserva por hora, elegiendo pista | Cero solapes garantizado en la base de datos |
| Pistas en 3D con el color del club | Panel en tiempo real: agenda, llegadas, pagos |
| Sin cuenta: el móvil se acuerda de ti | Pago en el club o Bizum, marcado a mano |
| Lista de espera con aviso al móvil | Reservas fijas semanales que se renuevan solas |
| Partidos abiertos para buscar gente | Clases con prioridad sobre las reservas |
| Clases individuales, por parejas y grupales | Logo, color y escena 3D propios por club |
| Puntos y hora de pista gratis | Roles: gestor y recepción |
| App instalable, en español, inglés y francés | Modo pueblo: pistas gratuitas y límite por persona |

Pensada para enseñarla: entras como jugador, recepción o encargado con un toque, sin registrarte. Los datos de ejemplo se restablecen solos cada madrugada.

Tecnología: Next.js, React, TypeScript, Tailwind, Three.js, Supabase (Postgres) y Vercel.

## Tu Chef Personal

App Android que te dice qué cocinar con lo que ya tienes en casa. Escribes los ingredientes que te quedan y la app te genera una receta completa con inteligencia artificial, sin tener que buscar ni comprar de más. Fue mi proyecto de fin de grado.

| Para quien cocina | Por dentro |
| --- | --- |
| Receta a partir de tus ingredientes, en segundos | Recetas generadas con Gemini 2.5 Flash |
| Registro e inicio de sesión | Sesión guardada en el móvil |
| Historial con todas las recetas que has generado | Base de datos local SQLite, funciona sin cuenta en la nube |
| Pantallas claras y modo oscuro | Java, XML y Android Studio |

Es una app de móvil, así que no tiene demo en el navegador.

## Mi Semana

**[Descargar la APK](https://github.com/Eselrawi/ddd/releases/latest/download/MiSemana.apk)**

Agenda semanal para el móvil. Escribes en una frase lo que tienes que hacer, por ejemplo «mañana a las 10 dentista», y la app entiende el día y la hora. Lo que no te da tiempo a hacer se pasa a mañana deslizando la tarea con el dedo.

| Para quien la usa | Por dentro |
| --- | --- |
| Tareas en una frase: «el viernes comprar pan», «pasado mañana a las 5 llamar a mamá» | Analizador propio de fechas y horas en español |
| Vista previa del día y la hora antes de añadir la tarea | Sin frameworks: HTML, CSS y JavaScript |
| Deslizar a un lado para hecha y al otro para pasarla a mañana | Gestos táctiles y vibración nativa |
| Lo que quedó sin hacer otros días aparece arriba, con un botón para pasarlo todo a hoy | Cuenta las veces que se ha aplazado cada tarea |
| Vista de día y de semana, un color por día y modo oscuro | Emoji automático según la tarea (médico, compra, gimnasio…) |
| Avisos: resumen por la mañana, pendientes por la noche y plan de mañana | Notificaciones locales con la hora de cada aviso ajustable |
| Todo se guarda en el móvil, sin cuenta y sin internet | APK compilada automáticamente con GitHub Actions |

Es una app de Android: se instala descargando la APK en el móvil.

Tecnología: HTML, CSS, JavaScript, Capacitor y GitHub Actions.

## Notas

En todos los proyectos el contenido y los datos son de ejemplo. El código no está publicado aquí.

## Autor

Raúl Gómez · [@Eselrawi](https://github.com/Eselrawi)

Desarrollado con ayuda de Claude Code.
