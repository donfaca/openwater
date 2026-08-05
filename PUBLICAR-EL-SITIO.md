# Cómo publicar el sitio (gratis, sin código)

## Opción recomendada: Netlify Drop

1. Descargá el zip completo del proyecto (botón de descarga en el chat).
2. Descomprimilo en tu computadora — te va a quedar una carpeta con todos los archivos `.dc.html`, imágenes, etc.
3. Andá a **https://app.netlify.com/drop**
4. Arrastrá la carpeta descomprimida (toda la carpeta, no un archivo suelto) sobre la zona que dice "Drag and drop your site output folder here".
5. En unos segundos Netlify te da una URL pública (algo como `nombre-random.netlify.app`) — el sitio ya está online.
6. (Opcional) Creá una cuenta gratuita en Netlify para poder editar el nombre del sitio o conectarlo a un dominio propio (ej: openwaterpatagonesviedma.com).

## Importante sobre la página de inicio

Netlify busca un archivo `index.html` como página principal. Este sitio usa `index.dc.html`. Dos formas de resolverlo:

- **Más simple**: al entrar a la URL agregá `/index.dc.html` (ej: `tusitio.netlify.app/index.dc.html`), y compartí ese link como el principal.
- **Prolijo**: dentro de la carpeta antes de subir, hacé una copia de `index.dc.html` y renombrala a `index.html` (dejá también el `.dc.html` original, no lo borres).

## Actualizaciones futuras

Cada vez que hagas cambios en el sitio acá, volvé a descargar el zip y arrastrá la carpeta de nuevo a Netlify Drop (pisa la versión anterior). No hace falta cuenta ni configuración adicional para actualizar.
