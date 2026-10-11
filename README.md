# Pan Vivo

Aplicación católica orientada a Colombia. Node.js 22.18 o posterior y npm.

## Desarrollo y validación

```sh
npm ci
npm run dev
npm run lint
npm test
npm run build
```

`npm run lint` comprueba tipos; no es un analizador de estilo. Las pruebas incluyen
fechas inválidas, un ciclo gregoriano completo de 400 años, textos largos, fallos
de fuentes, migración de cachés, contratos HTTP y generación compartida.

## Fuentes y límites editoriales

- **Lecturas:** Evangelizo, siempre para la fecha exacta solicitada. No se
  completan con textos de otra semana, resúmenes ni tablas de fechas particulares.
  Se requiere primera lectura, salmo y evangelio íntegros en la respuesta.
  Una fecha no publicada o una fuente que falla produce un aviso, no un texto inventado.
- Se rechazan diferencias identificables en los traslados colombianos de
  Epifanía, Bautismo, Ascensión y Corpus Christi. Esto **no valida todo el
  leccionario propio de Colombia ni de cada diócesis**. Las celebraciones
  particulares requieren contraste editorial con el Ordo. No se garantiza
  cobertura de lecturas o santoral para años que las fuentes aún no publican.
- **Santo destacado:** base editorial local aportada en el Excel V1.0.2,
  independiente de la celebración litúrgica. Sus 366 entradas mes-día cubren
  también años bisiestos, sin consultas diarias a San Pablo ni al Ordo.
  Es cobertura nominal provisional, no validación del Martirologio ni garantía
  de coincidencia con Pan de la Palabra impreso: 174 entradas proceden del
  calendario y 192 del santoral complementario. En 2026 se usan 191 de estas últimas.
  La fuente y revisión se conservan internamente; no se muestran en las tarjetas.
  Solo se reutilizan biografías locales por identidad exacta o alias explícito,
  independientemente de la fecha de su registro. Si falta la biografía, el servidor
  solicita una síntesis a Gemini con Google Search. Solo acepta segmentos con
  referencias de búsqueda para esa identidad y muestra las fuentes. Esto no
  equivale a una revisión histórica editorial ni garantiza cobertura de todos
  los santos. No cambia lecturas, celebraciones ni colores.
- Solo se importan nombres y metadatos del Excel. Vatican News se
  enlaza, sin reproducir sus textos o imágenes. Su enlace al evangelio de hoy
  no equivale a la fecha histórica o futura seleccionada.
- Antes de una publicación comercial, confirmar los permisos de uso de las
  traducciones bíblicas, textos y recursos gráficos con sus titulares.

“Hoy”, rutinas y estadísticas usan `America/Bogota`. Las fechas seleccionadas
son fechas civiles, no conversiones de medianoche UTC. El calendario admite
1583–9999; esto no implica cobertura editorial para todo ese intervalo.

### Revisión del santoral editorial

[colombianEditorialSaints.json](./src/data/colombianEditorialSaints.json) contiene
la selección por mes-día, fuentes y notas pendientes. Se debe contrastar
periódicamente con Pan de la Palabra impreso. Corregir una entrada recurrente
no equivale a trasladar una fiesta: la capa litúrgica sigue siendo independiente.
Por ejemplo, la base recibida conserva “Epifanía del Señor” el 6 de enero como
entrada nominal; no cambia la fecha colombiana calculada de esa celebración.
No se importan las precedencias ni el calendario anual provisional del Excel.

Para actualizar desde un libro con las mismas hojas, sin dependencias Python externas:

```sh
python3 scripts/import_santoral.py /ruta/al/libro.xlsx src/data/colombianEditorialSaints.json
```

El importador exige 366 claves válidas, únicas y con nombre. Tras la revisión,
cambiar la versión de la base cuando cambie su contenido, ejecutar las pruebas
y desplegar. Las cachés de lecturas anteriores conservan sus textos, pero su
santo se sustituye por la selección editorial vigente, también sin conexión.

## Reflexión compartida, sin chat

### Biografías compartidas

Aplicar [002_saint_biographies.sql](./migrations/002_saint_biographies.sql) en la
misma base PostgreSQL configurada en `DATABASE_URL`. Las biografías recuperadas se
guardan en `public.saint_biographies` por nombre normalizado, con texto, enlaces
de búsqueda, fecha de consulta, modelo y versión del prompt. Una entrada terminada
se lee antes de reservar generación: otros clientes, años o instancias no llaman
de nuevo a Gemini por ese santo. No hay regeneración automática por vencimiento.
Las correcciones editoriales deben revisarse; no borrar las entradas al desplegar.

Una reserva transaccional de 180 segundos evita generaciones simultáneas entre
instancias. Hay un máximo de tres intentos por identidad y 60 segundos de espera
tras fallos. `BIOGRAPHY_DAILY_LIMIT` limita nuevas reservas (100 por defecto), no
lecturas de biografías existentes. Si se agotan intentos, revisar la fuente y el
servicio antes de restablecerlos. La caché en memoria acelera lecturas y el
almacenamiento del navegador permite reutilizar la biografía sin conexión incluso
si las lecturas del día no están disponibles.

Sin persistencia, migración o clave de Gemini configuradas, no se genera ni se
presenta información como guardada: aparece un aviso de indisponibilidad.
El modelo debe admitir Google Search. Si el modelo configurado devuelve HTTP 404,
se intenta una sola vez `gemini-3.8-flash` y se guarda el modelo realmente usado.
Las fuentes se toman de los metadatos de
búsqueda, no de URLs inventadas en el texto; el proveedor puede devolver enlaces
de redirección de Google. Se descartan segmentos sin citas. La búsqueda reduce
el riesgo de invención, pero no sustituye la revisión de las fuentes.

La API acepta únicamente `{ "date": "YYYY-MM-DD" }` en `POST /api/reflection`.
Obtiene el evangelio en el servidor: el visitante no puede introducir preguntas
ni modificar el prompt o las lecturas. No existe una ruta de chat.

Una reflexión terminada se guarda en `public.daily_reflections` en Neon
(PostgreSQL), con la fecha como clave primaria única.
Todos los visitantes reciben el mismo texto, también tras reinicios o desde
otra instancia del servidor. Una transacción reserva la generación y evita
llamadas concurrentes con bloqueos transaccionales y reservas de 180 segundos.
No se regenera al pulsar reintentar. El servidor usa una conexión pooled y
consultas parametrizadas; nunca envía credenciales de Neon al navegador.

Las reflexiones nuevas solicitan 300–400 palabras en cuatro párrafos: dos de
meditación del Evangelio, uno de aplicación con propósito y uno de oración.
Es una instrucción al modelo, no una garantía de
conteo exacto. Las respuestas interrumpidas no se guardan como textos completos.
El cambio de extensión no regenera reflexiones existentes. Se conservan modelo
y versión del prompt como metadatos para trazabilidad.

Se permiten como máximo tres intentos por fecha, con espera tras fallos, y un
presupuesto global diario de nuevas reservas (`REFLECTION_DAILY_LIMIT`, 100 por
defecto). Cada reserva permite como máximo dos llamadas: `gemini-3.8-flash`
(o `GEMINI_MODEL`) y un único intento con `gemini-3.1-flash-lite` ante timeout
o HTTP 500/502/503/504. No se cambia de modelo ante errores de cuota, permisos,
modelo inexistente, texto vacío o respuesta interrumpida. No hay reintentos
internos del SDK ni textos prefabricados que oculten un fallo. Por tanto, el
límite diario de reservas no equivale al número de llamadas ni a un límite
monetario exacto. Se guarda el modelo que realmente respondió.
Leer reflexiones existentes no consume ese presupuesto. Si se agotan
los intentos, el administrador debe revisar la causa antes de restablecer el
documento. No borrar reflexiones terminadas durante un despliegue.

No se puede garantizar exactamente una llamada al proveedor ante un fallo
entre la generación y el guardado; las reservas y límites acotan los reintentos.
Sin persistencia configurada **no se genera**: se muestra indisponibilidad y un
enlace a Vatican News. La tarjeta se titula “Reflexión”, sin advertencia adicional;
la API y las instrucciones del modelo mantienen su identidad de asistente, no
de sacerdote.

### Configuración de servidor

Copiar las variables de [.env.example](./.env.example) al gestor de secretos del
alojamiento. Nunca incluir credenciales privadas en archivos versionados ni en
variables `VITE_*`.

1. Configurar `GEMINI_API_KEY` y, opcionalmente, `GEMINI_MODEL` (por defecto,
   `gemini-3.8-flash`). El modelo alternativo es `gemini-3.1-flash-lite`.
   Una variable `GEMINI_MODEL` existente prevalece sobre el nuevo valor por
   defecto: actualizarla en cada entorno para restaurar el modelo anterior.
   Confirmar que el modelo admite generación en la
   cuenta; una clave válida no garantiza acceso a todos los modelos.
2. Configurar `DATABASE_URL` con la conexión **pooled** de Neon al proyecto
   Pandelapalabra, rama production y base neondb. Conservar los parámetros TLS
   de la conexión. La conexión MCP de administración no configura esta variable
   automáticamente en Node o Vercel.
3. Aplicar [001_shared_reflections.sql](./migrations/001_shared_reflections.sql)
   mediante una migración revisada. Las tablas ya se crearon en el proyecto
   conectado durante la integración. No ejecutar migraciones al atender visitas.
4. El usuario de base de datos del servidor necesita SELECT, INSERT y UPDATE en
   ambas tablas. No exponerlas con permisos anónimos o una API pública de datos.
   No hacen falta credenciales Firebase Admin para las reflexiones.
5. Configurar límites de cuota/costo de Gemini y protección de tráfico en el
   alojamiento. Los límites de generación no sustituyen un WAF o límites HTTP.

La configuración Firebase existente sigue usándose para autenticación, notas,
rutinas y favoritos; esta integración cambia la persistencia de las reflexiones,
no migra los datos personales. Si antes se guardaron reflexiones en Firestore
en otro despliegue, deben importarse a Neon antes de habilitar generación allí:
el servidor no consulta dos bases ni regenera contenido para migrarlo.

## Despliegue

### Servidor Node

```sh
npm ci
npm run build
PORT=3000 npm start
```

El build crea la aplicación en `dist/` y un servidor ESM compilado en
`server.js`. No ejecutar el TypeScript original con Node como sustituto del
build. El servidor responde JSON para errores API y 404 para archivos estáticos
inexistentes, en lugar de devolver HTML como si fueran lecturas o scripts.

### Vercel

[vercel.json](./vercel.json) define el build estático, la función API y un máximo
de 120 segundos. Cada modelo tiene un plazo de 40 segundos (hasta dos llamadas);
el navegador espera hasta 125 segundos.
El margen restante permite obtener lecturas, reservar y guardar en Neon.
Si Gemini devuelve 504 antes de ese plazo, se informa el fallo y no se guarda
una reflexión parcial. Seleccionar Node 22 o posterior y configurar los secretos en
el entorno correspondiente. Comprobar que el plan permite ese tiempo de ejecución.

La aplicación funciona sin IA cuando el servidor carece de credenciales. Esto
no es una validación de que la IA quedó habilitada: verificar expresamente una
reflexión nueva y su reutilización desde otro navegador/instancia.

## Persistencia y operación

- Invitados: notas, rutinas y favoritos locales, sin escrituras Firestore.
  Borrar datos del navegador elimina esos datos; no se promete sincronización.
- Usuarios autenticados: los cambios se confirman en Firestore antes de
  actualizar el respaldo local. Un fallo muestra error, no éxito ficticio.
  Un timeout significa “sin confirmación”: la operación remota podría terminar
  después; verificar el estado antes de repetirla.
- Las lecturas completas se conservan para uso sin conexión con caché acotada;
  la verificación de santos se actualiza independientemente.
- El audio respeta su ajuste global.
- El tamaño de fuente se aplica a lecturas, reflexión, biografías y oraciones
  en tarjetas y modales, notas y textos bíblicos; los controles conservan su tamaño.
- Los permisos de notificaciones no
  implementan un programador de recordatorios; la interfaz lo advierte.
- No se despliegan reglas, infraestructura ni secretos al ejecutar el build.

Antes de aprobar producción, comprobar en el alojamiento real: autenticación y
dominios autorizados, conexión y permisos de Neon, reglas de la base Firebase correcta,
generación/reutilización de reflexiones, cuotas, disponibilidad de fuentes y
propios diocesanos. Las pruebas locales no certifican esos servicios externos.
