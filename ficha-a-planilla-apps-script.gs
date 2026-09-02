/**
 * FICHA DE ASOCIACIÓN → PLANILLA + EMAIL CON CSV ADJUNTO
 * Open Water Río Negro · Asociación Civil y Deportiva Open Water
 *
 * Qué hace: recibe la ficha que envía ficha-asociacion.html, la guarda como
 * fila en una planilla de Google y manda un correo a openwaterrionegro@gmail.com
 * con el CSV del socio ADJUNTO, listo para importar en "Socios activos".
 *
 * CÓMO INSTALARLO (una sola vez)
 * 1. Creá una planilla nueva en Google Sheets (por ejemplo "Socios OW").
 * 2. Extensiones → Apps Script. Borrá todo y pegá este archivo.
 * 3. Guardá. Implementar → Nueva implementación → tipo "Aplicación web":
 *      - Ejecutar como: yo
 *      - Quién tiene acceso: cualquier persona
 *    Implementar → copiá la URL que termina en /exec.
 * 4. Pegá esa URL en ficha-asociacion.html, en CONTACTO.endpoint.
 * 5. Enviá una ficha de prueba: tiene que aparecer la fila en la planilla y
 *    llegarte el correo con el archivo OW-socio-....csv adjunto.
 */

const DESTINO = 'openwaterrionegro@gmail.com';
const HOJA = 'Fichas';

/* Columnas del CSV que importa "Socios activos" (mismo orden y nombres) */
const COLS_REGISTRO = [
  'Fecha de alta', 'Nombre y apellido', 'DNI', 'Edad', 'Fecha de nacimiento',
  'Género', 'Localidad', 'Provincia', 'Teléfono', 'Email', 'Plan',
  'Cuota mensual', 'Forma de pago', 'Alta deseada', 'Nivel de nado',
  'Experiencia aguas abiertas', 'Apto médico', 'Obra social', 'Grupo sanguíneo',
  'Contacto de emergencia', 'Talle', 'Adulto responsable', 'Uso de imagen'
];

function doPost(e) {
  try {
    const datos = JSON.parse(e.postData.contents);
    guardarEnPlanilla(datos);
    enviarCorreo(datos);
    return respuesta({ok: true});
  } catch (err) {
    return respuesta({ok: false, error: String(err)});
  }
}

function doGet() {
  return respuesta({ok: true, mensaje: 'Endpoint de fichas Open Water activo.'});
}

function guardarEnPlanilla(d) {
  const ss = SpreadsheetApp.getActive();
  const hoja = ss.getSheetByName(HOJA) || ss.insertSheet(HOJA);
  const claves = Object.keys(d);
  if (hoja.getLastRow() === 0) hoja.appendRow(claves);
  const cab = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(String);
  claves.forEach(k => { if (cab.indexOf(k) === -1) { hoja.getRange(1, cab.length + 1).setValue(k); cab.push(k); } });
  hoja.appendRow(cab.map(k => d[k] || ''));
}

function enviarCorreo(d) {
  const nombre = d['Nombre y apellido'] || 'nuevo socio';
  const plan = d['Membresía'] || d['Plan'] || '';
  const csv = csvRegistro(d);
  const archivo = 'OW-socio-' + slug(nombre) + (d['DNI'] ? '-' + d['DNI'] : '') + '.csv';

  const cuerpo =
    'Nueva ficha de asociación.\n\n' +
    'Socio: ' + nombre + '\n' +
    'Plan: ' + plan + '\n' +
    'Localidad: ' + (d['Localidad'] || '') + '\n' +
    'Teléfono: ' + (d['Teléfono'] || '') + '\n' +
    'Email: ' + (d['Email'] || '') + '\n\n' +
    'Adjunto va el CSV para importar en la página Socios activos (botón "Cargar CSV de la ficha").\n\n' +
    '--- FICHA COMPLETA ---\n' +
    Object.keys(d).map(k => k + ': ' + d[k]).filter(l => !/: *$/.test(l)).join('\n');

  MailApp.sendEmail({
    to: DESTINO,
    replyTo: d['Email'] || DESTINO,
    subject: 'Ficha de asociación · ' + nombre + (plan ? ' · ' + plan : ''),
    body: cuerpo,
    name: 'Fichas Open Water',
    attachments: [Utilities.newBlob('\uFEFF' + csv, 'text/csv', archivo)]
  });
}

/* Arma el CSV de una fila con las mismas columnas que exporta la ficha */
function csvRegistro(d) {
  const plan = String(d['Membresía'] || d['Plan'] || '');      // "Socio Local · $40.000/mes"
  const partes = plan.split('·');
  const fila = {
    'Fecha de alta': hoyAR(),
    'Nombre y apellido': d['Nombre y apellido'],
    'DNI': d['DNI'],
    'Edad': edad(d['Fecha de nacimiento']),
    'Fecha de nacimiento': fechaAR(d['Fecha de nacimiento']),
    'Género': d['Género'],
    'Localidad': d['Localidad'],
    'Provincia': d['Provincia'],
    'Teléfono': d['Teléfono'],
    'Email': d['Email'],
    'Plan': (partes[0] || '').trim(),
    'Cuota mensual': (partes[1] || '').replace('/mes', '').trim(),
    'Forma de pago': d['Forma de pago'],
    'Alta deseada': fechaAR(d['Alta deseada']),
    'Nivel de nado': d['Nivel'],
    'Experiencia aguas abiertas': d['Experiencia aguas abiertas'],
    'Apto médico': d['Apto médico'],
    'Obra social': d['Obra social'],
    'Grupo sanguíneo': d['Grupo sanguíneo'],
    'Contacto de emergencia': [d['Emergencia · nombre'], d['Emergencia · vínculo'], d['Emergencia · teléfono']].filter(Boolean).join(' / '),
    'Talle': d['Talle'],
    'Adulto responsable': d['Tutor/a'],
    'Uso de imagen': d['Uso de imagen'] ? 'Sí' : 'No'
  };
  const esc = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  return COLS_REGISTRO.map(esc).join(';') + '\r\n' + COLS_REGISTRO.map(k => esc(fila[k])).join(';') + '\r\n';
}

function edad(v) {
  const f = new Date(v);
  if (!v || isNaN(f.getTime())) return '';
  const hoy = new Date();
  let e = hoy.getFullYear() - f.getFullYear();
  const m = hoy.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) e--;
  return e >= 0 ? e : '';
}
function fechaAR(v) {
  if (!v) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v;
  const f = new Date(v);
  return isNaN(f.getTime()) ? String(v) : Utilities.formatDate(f, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
}
function hoyAR() {
  return Utilities.formatDate(new Date(), 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
}
function slug(t) {
  return String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}
function respuesta(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
