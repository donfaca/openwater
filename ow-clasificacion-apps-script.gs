/**
 * CLASIFICACIÓN FINAL DEL 1ER TORNEO DE PILETA OW  (Excel: pestaña 1 = por nadadores, pestaña 2 = por equipos)
 * La página del torneo lee las dos primeras pestañas del Excel y las manda acá.
 * Este script las guarda en Drive (clasificacion.json) y la página «Clasificación del torneo» las muestra.
 *
 * INSTALAR (una sola vez): script.google.com → Proyecto nuevo → pegar este código →
 *   Implementar → Nueva implementación → tipo «Aplicación web» →
 *   Ejecutar como: Yo · Quién tiene acceso: Cualquier persona → Implementar.
 *   Copiar la URL que termina en /exec y pegarla en ow-torneo-config.js.
 */
var CLAVE = '129430';
var CARPETA = 'Clasificacion 1er torneo pileta OW';
var ARCHIVO = 'clasificacion.json';

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function archivo_(crear) {
  var it = DriveApp.getFoldersByName(CARPETA), c = it.hasNext() ? it.next() : (crear ? DriveApp.createFolder(CARPETA) : null);
  if (!c) return null;
  var fs = c.getFilesByName(ARCHIVO);
  return fs.hasNext() ? fs.next() : (crear ? c.createFile(ARCHIVO, '{}', 'application/json') : null);
}

function doGet() {
  var f = archivo_(false);
  return ContentService.createTextOutput(f ? f.getBlob().getDataAsString() : '{}').setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  if (d.clave !== CLAVE) return json_({ ok: false, error: 'Código incorrecto' });
  var f = archivo_(true);
  if (d.accion === 'quitar') { f.setContent('{}'); return json_({ ok: true }); }
  f.setContent(JSON.stringify({ fecha: new Date().toISOString(), archivo: d.nombre || '', hojas: d.hojas || [] }));
  return json_({ ok: true });
}
