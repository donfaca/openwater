# Cómo poner en marcha las inscripciones (Summer · Eclipse · Combo)

Todo lo hace **un solo** Apps Script: `ow-inscripciones-apps-script.gs`.
Se instala una vez y sirve para las tres fichas web.

Tiempo: unos 20 minutos. Necesitás la cuenta de Google que **pueda editar las
dos planillas** (la de Summer y la de Eclipse). Lo más práctico es hacer todo
con `openwaterrionegro@gmail.com`.

---

## 1. Conseguir el token de Mercado Pago

Está detallado en `PAGOS-MERCADOPAGO.md`. Resumen:

1. Entrá a <https://www.mercadopago.com.ar/developers/panel> con la cuenta de la
   Asociación.
2. Tus integraciones → creá (o abrí) la aplicación de Open Water.
3. Credenciales de **producción** → copiá el **Access Token**
   (empieza con `APP_USR-…`).

Guardalo a mano, lo pegás en el paso 3.

---

## 2. Crear el proyecto de Apps Script

1. Andá a <https://script.google.com> → **Nuevo proyecto**.
2. Ponele nombre: `Inscripciones OW 2027`.
3. Borrá todo el contenido del editor (`function myFunction() {}`).
4. Abrí `ow-inscripciones-apps-script.gs` de este proyecto, copiá **todo** y
   pegalo ahí.
5. Ícono de guardar (o `Ctrl+S`).

---

## 3. Completar la configuración

Arriba del archivo, en el editor de Apps Script:

```js
const ACCESS_TOKEN = 'PEGAR-AQUI-EL-ACCESS-TOKEN-DE-MERCADO-PAGO';
```

Reemplazá el texto por el token del paso 1, entre las comillas.

Lo demás ya viene cargado y **no hay que tocarlo**:

| Constante | Valor |
| --- | --- |
| `PLANILLAS.summer` | `1_Ex-EQQZTJ32n1vp2GqLCIXOT3c2l_t97BnsVl1Txn0` (SUMMER OPEN WATER 2027 respuestas) |
| `PLANILLAS.eclipse` | `1J0uIkTKe0ipASPzwDGmfV8QP95ETqTevKyseeT5l7mQ` (OPEN WATER ECLIPSE 2027) |
| `PLANILLAS.combo` | el mismo archivo de Eclipse: ahí se crea la hoja del combo |
| `HOJAS` | los nombres de las pestañas de cada planilla |
| `PRUEBA` | `false`. En `true` todos los pagos salen **$10** |

Guardá de nuevo.

---

## 4. Autorizar los permisos

1. En el selector de funciones (arriba, al lado de "Depurar") elegí
   **`sincronizarCombo`** y tocá **Ejecutar**.
2. Google pide permisos: **Revisar permisos** → elegí la cuenta →
   *"Google no verificó esta aplicación"* → **Configuración avanzada** →
   **Ir a Inscripciones OW 2027 (no seguro)** → **Permitir**.
   Es tu propio script, por eso aparece ese cartel.
3. Cuando termina, andá a la planilla de Eclipse: tiene que haber aparecido la
   pestaña **`Inscripciones Combo 2027`** con los nadadores que ya están en las
   dos competencias. Si no aparece nadie nuevo, está bien: significa que no hay
   coincidencias todavía.

---

## 5. Publicar la aplicación web

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. Engranaje → tipo **Aplicación web**.
3. Configurá exactamente así:
   - Descripción: `v1 inscripciones`
   - **Ejecutar como: Yo** (`openwaterrionegro@gmail.com`)
   - **Quién tiene acceso: Cualquier persona**
4. **Implementar** → copiá la **URL de la aplicación web**: termina en `/exec`.

> Cada vez que edites el script tenés que hacer
> **Implementar → Administrar implementaciones → editar (lápiz) → Versión: Nueva
> versión → Implementar**. Si creás una implementación nueva, cambia la URL y hay
> que volver a pegarla en las fichas.

---

## 6. Pegar la URL en las seis fichas

La misma URL va en las tres fichas, en las dos carpetas. En cada archivo,
buscá la línea `const ENDPOINT = '…';` (está al principio del `<script>`, cerca
del final del archivo) y pegá la URL entre las comillas:

- `ficha-summer-2027.html`
- `ficha-eclipse-2027.html`
- `ficha-combo-2027.html`
- `sitio-openwater/ficha-summer-2027.html`
- `sitio-openwater/ficha-eclipse-2027.html`
- `sitio-openwater/ficha-combo-2027.html`

Queda así:

```js
const ENDPOINT = 'https://script.google.com/macros/s/AKfycb…/exec';
```

Las tres usan la misma URL: cada ficha ya avisa qué evento es (`summer`,
`eclipse` o `combo`).

Después subí los cambios a GitHub para que Cloudflare publique el sitio.

---

## 7. Probar de punta a punta

1. En el script: `const PRUEBA = true;` → guardar → **Implementar → Administrar
   implementaciones → Nueva versión**.
2. Abrí `ficha-combo-2027.html`, completá nombre, DNI y email, generá el QR y
   pagá los **$10** desde el celular.
3. En unos segundos el cartel pasa a **"✓ Pago confirmado"** y se habilita
   *Enviar inscripción del combo*.
4. Enviala y revisá que aparezca:
   - una fila en `Inscripciones Combo 2027` (planilla de Eclipse),
   - una fila en `Inscripciones Summer 2027` (planilla de Summer),
   - una fila en `Inscripciones Eclipse 2027`,
   - los mails: uno a la organización y uno al nadador.
5. Borrá esas filas de prueba, volvé a poner `PRUEBA = false` y **implementá
   nueva versión**. Este último paso es el que se olvida: si queda en `true`,
   todos cobran $10.

---

## 8. Activador diario de la sincronización

Para que el combo se arme solo con quien aparece en las dos planillas:

1. En el proyecto: ícono del **reloj** (Activadores) → **Agregar activador**.
2. Función: **`sincronizarCombo`** · Origen: **Basado en tiempo** ·
   Tipo: **Temporizador diario** · Hora: la que quieras (por ejemplo 7–8 a. m.).
3. Guardar.

Cada vez que sume gente te llega un mail con la lista. Compara por DNI, así que
podés correrlo cuantas veces quieras: no duplica.

---

## Qué escribe cada ficha

| Ficha | Escribe en |
| --- | --- |
| Summer | `Inscripciones Summer 2027` + `Pagos Summer` |
| Eclipse | `Inscripciones Eclipse 2027` + `Pagos Eclipse` |
| **Combo** | `Inscripciones Combo 2027` + `Inscripciones Summer 2027` + `Inscripciones Eclipse 2027` (+ `Pagos Combo`) |

En las filas que genera el combo, la columna **Origen** dice
`Combo Summer + Eclipse` y el **Monto** dice `Incluido en el combo (…)`, para que
no parezca que pagó dos veces.

Las columnas se ubican **por encabezado**, sin importar mayúsculas ni acentos, y
reconocen los textos largos de las preguntas de los Google Forms. Si un dato no
tiene columna, se agrega una al final: nunca reordena lo que ya está cargado.

---

## Si algo falla

- **"No hay conexión con el sistema de pagos"** → la URL del `ENDPOINT` está mal
  o la implementación no quedó como *Cualquier persona*.
- **"No se pudo generar el pago"** → el Access Token no es de producción, está
  vencido o quedó con espacios al pegarlo.
- **No aparecen filas en una planilla** → la cuenta que ejecuta el script no
  tiene permiso de edición en ese archivo, o cambió el nombre de la pestaña
  (revisá `HOJAS` en el script).
- **Ver errores** → en Apps Script, menú izquierdo **Ejecuciones**: muestra cada
  llamada con su detalle.
