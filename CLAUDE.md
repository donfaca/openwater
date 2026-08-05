# Open Water Patagones-Viedma — notas del proyecto

Sitio estático en vivo en **https://openwater.ar** (Cloudflare Pages, se
redeploya al subir a GitHub). Idioma: español (Argentina).

## Estructura de archivos
- **Editables (pantalla gráfica):** `*.dc.html` en la raíz. Son la fuente.
- **Publicado / en vivo:** carpeta `sitio-openwater/*.html` (espejo de las
  raíz, con enlaces `.html` en vez de `.dc.html`). Al cambiar un master hay que
  reflejarlo acá.
- `paquete-escritorio/` y `paquete-movil/` son paquetes viejos de descarga
  (obsoletos, no son la fuente).

## Contador de visitas (GoatCounter)
- **TODA la lógica del contador vive en `ow-stats.js`.** Hay una copia idéntica
  en `sitio-openwater/ow-stats.js` (porque cada carpeta carga la suya por ruta
  relativa). **Si editás uno, editá el otro igual.**
- Cuenta **visitantes únicos** (1 por IP/día, sin guardar IP). NUNCA volver a
  usar contadores de `localStorage` (contaban recargas de un solo navegador).
- Código de cuenta: `CODE = 'openwater'` (→ `openwater.goatcounter.com`).
- Se incluye con `<script src="./ow-stats.js"></script>` en el `<helmet>` de la
  home (escritorio y móvil). El tracking solo se registra en `openwater.ar`
  (no en el editor/preview).
- En el pie: `VISITAS AL SITIO: N` + botón **VER ESTADÍSTICAS** →
  `window.OWStats.openPanel()`. Instrucciones de alta: `CONTADOR-DE-VISITAS.md`.

## Reglas al editar
- Cambios chicos: tocar solo lo pedido; mantener estilos/colores existentes
  (teal `#0a2438`/`#08202f`, dorado `#c9a24d`, tipografías Bebas Neue + Barlow).
- Al cambiar una página, reflejar el cambio en su par de `sitio-openwater/`.
