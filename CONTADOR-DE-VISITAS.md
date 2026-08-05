# Contador de visitas — cómo activarlo (5 minutos, sin código)

El sitio ya tiene todo el contador programado. Solo falta **crear la cuenta
gratuita del servicio** que cuenta las visitas reales. Seguí estos pasos.

> Por qué hace falta: una página estática no puede, por sí sola, contar
> visitantes reales, evitar que una misma IP cuente de más, ni saber desde qué
> lugares se vio. Eso lo hace **GoatCounter** (gratis, privado: cuenta 1 por IP
> por día y NO guarda la IP).

## Paso 1 — Crear la cuenta
1. Entrá a **https://www.goatcounter.com/** y tocá **"Sign up"** (o "Start").
2. En **Code**, escribí exactamente: **openwater**
   (te queda el panel en `openwater.goatcounter.com`).
   - El código DEBE ser `openwater`, porque es el que ya usa el sitio.
   - Si aparece "ya está en uso", elegí otro (ej: `openwaterpv`) y **avisame**:
     cambio una sola línea y listo.
3. Poné tu email y una contraseña → **crear cuenta**.

## Paso 2 — Que el NÚMERO aparezca en la web
1. En tu panel, arriba a la derecha, entrá a **Settings** (Configuración).
2. Buscá y **tildá**: **"Allow adding visitor counts on your website"**.
3. **Save** (Guardar).
   - Sin esto, en la web el número se ve como "—".

## Paso 3 — Que las estadísticas sean PÚBLICAS (abiertas a todos)
1. En **Settings**, buscá la opción de visibilidad / privacidad del sitio
   ("Site is visible to…" o similar).
2. Elegí la opción **pública** ("Anyone can view" / cualquiera puede ver).
3. **Save**.
   - Así, el botón **"Ver estadísticas"** y el mapa de ubicaciones quedan
     abiertos para cualquiera, sin pedir login.

## Paso 4 (opcional) — No contar tus propias visitas
- En **Settings → "Ignore these IPs"** agregá tu IP.
- Igual, tu navegador ya cuenta como **1 visita por día** como máximo.

## Listo
- El sitio ya apunta a `openwater.goatcounter.com`. No hay que tocar nada más.
- Subí los cambios a GitHub → Cloudflare publica solo en ~1 min.
- Los números tardan hasta **~4 horas** en actualizarse (GoatCounter cachea).

---

## Qué muestra el sitio
- En el pie de la **página de inicio** (escritorio y móvil):
  `VISITAS AL SITIO: N` + botón **VER ESTADÍSTICAS**.
- El número **N** = **visitantes únicos** de todo el sitio (1 por IP/día).
- El botón abre un panel con: total, últimos 7 y 30 días, y un botón
  **"Ver ubicaciones y todo el detalle"** que lleva al panel público de
  GoatCounter (mapa de lugares, páginas más vistas, dispositivos, referencias).

## Notas
- Ahora se cuentan las visitas de **TODAS las páginas del sitio** (escritorio y
  móvil). Cada página incluye `ow-stats.js` de forma invisible; el total
  (`VISITAS AL SITIO`) suma los visitantes únicos de todo el sitio, y en el
  panel público de GoatCounter vas a ver el detalle por página y las ubicaciones.
- El número visible `VISITAS AL SITIO` + botón **VER ESTADÍSTICAS** sigue solo
  en el pie de la **home** (no hace falta mostrarlo en cada página).
- **Para cambiar de cuenta** (otro código): editá `CODE` arriba de todo en
  `ow-stats.js` **y** en `sitio-openwater/ow-stats.js` (misma línea en los dos).
