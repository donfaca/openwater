# Sitio Open Water Patagones-Viedma

Este repositorio ES el sitio. Cloudflare Pages (o Netlify) lo publica tal cual.

## Estructura
- **Raíz (`/`)** = versión de **escritorio**. Página principal: `index.html`.
- **`/m/`** = versión de **móvil**, completa y autónoma.

## Cambio automático escritorio ↔ móvil
Cada página detecta el dispositivo y redirige sola:
- En un teléfono, cualquier página de la raíz salta a su equivalente en `/m/`.
- En una compu, cualquier página de `/m/` vuelve a la de escritorio.

Para forzar una versión: agregá `?full` a la URL para ver escritorio (aunque
estés en el celu), o `?movil` para forzar la versión móvil.

Los nombres de archivo se repiten en las dos versiones a propósito; por eso el
móvil vive en su carpeta `/m` y no se mezcla en la raíz.

## Cómo actualizar
1. Hacés los cambios en la pantalla gráfica.
2. Descargás el zip actualizado.
3. Reemplazás los archivos en el repo (raíz = escritorio, `/m` = móvil) y push.
   Cloudflare/Netlify redeploya solo.

> El cambio automático ya está incluido en estos `.html`. No hace falta tocar nada.

## Contador de visitas
La lógica vive en `ow-stats.js` (hay una copia en `/m/ow-stats.js`). Cuenta
visitantes únicos vía GoatCounter (cuenta `openwater`).
