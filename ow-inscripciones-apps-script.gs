/**
 * INSCRIPCIONES OPEN WATER 2027 · SUMMER + ECLIPSE + COMBO
 * Un solo Apps Script para las tres fichas web:
 *   ficha-summer-2027.html   → evento: 'summer'
 *   ficha-eclipse-2027.html  → evento: 'eclipse'
 *   ficha-combo-2027.html    → evento: 'combo'
 *
 * ESTRUCTURA ESTRICTA DE COLUMNAS — MUY IMPORTANTE
 *   Las tres hojas ("Summer", "Eclipse", "Combo") empiezan SIEMPRE con estas
 *   13 columnas, en este orden exacto (MASTER, más abajo):
 *     Fecha de envío · Número de inscripto (secuencial) · Nombre y apellido ·
 *     Género · Teléfono · Email · DNI · CUIL · Fecha de nacimiento · Prueba ·
 *     Categoría · Ciudad · Club o equipo
 *   Después siguen las columnas propias de cada hoja (pago, salud, notas…).
 *   El script NUNCA agrega columnas nuevas: lo que no tiene columna propia se
 *   resume en "Notas". "Número de inscripto" lo calcula el script solo
 *   (cantidad de filas ya cargadas + 1); no lo manda la ficha.
 *
 * QUÉ HACE
 *   {accion:'crear', evento}  → crea el pago en Mercado Pago y devuelve el link del QR
 *   {accion:'estado', ref}    → consulta si ese pago ya fue acreditado
 *   {accion:'ficha', evento}  → guarda la inscripción en la planilla que corresponde:
 *        summer  → hoja "Summer"
 *        eclipse → hoja "Eclipse"
 *        combo   → hoja "Combo"  +  hoja "Summer"  +  hoja "Eclipse"
 *        Manda además un mail HTML (con logo/s del evento) a la organización y otro
 *        al nadador con TODOS los campos de su ficha, agradecimiento, teléfonos
 *        y link al grupo de WhatsApp de la comunidad (avisar()).
 *   probarMail() → manda un mail de ejemplo (combo) a DESTINO para revisar el diseño.
 *   sincronizarCombo() → agrega a "Combo" a quien esté en Summer Y en Eclipse.
 *   reordenarPlanillas() → CORRIGE LAS TRES HOJAS YA EXISTENTES: reconstruye
 *        cada una con la estructura estricta de arriba, numerando a todos los
 *        que ya están cargados y normalizando Género/Categoría/Prueba a partir
 *        de sus columnas actuales. Se corre UNA VEZ (a mano, desde el editor)
 *        después de instalar esta versión, para dejar limpio lo ya cargado.
 *        De ahí en más cada ficha nueva ya entra bien ordenada sola.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * INSTALACIÓN
 * 1. https://script.google.com → pegar este archivo entero (reemplazando el
 *    anterior; no debe quedar ningún otro .gs en el proyecto).
 * 2. Completá ACCESS_TOKEN (ver PAGOS-MERCADOPAGO.md).
 * 3. Guardar → Implementar → Administrar implementaciones → editar → Nueva
 *    versión → Implementar (la URL /exec no cambia, no hay que tocar las fichas).
 * 4. En el selector de funciones (arriba) elegí "reordenarPlanillas" → Ejecutar.
 *    Revisá las tres planillas: ya deberían tener la estructura estricta.
 * 5. Activador diario opcional para sincronizarCombo.
 */

const ACCESS_TOKEN = 'PEGAR-AQUI-EL-ACCESS-TOKEN-DE-MERCADO-PAGO';
const DESTINO = 'openwaterrionegro@gmail.com';
const CLAVE_ACREDITACION = '129430';   // misma clave que pide la web para ver las listas de inscriptos
const PRUEBA = false;   // true = todos los pagos cuestan $10, para probar

const PLANILLAS = {
  summer:  '18u_DigYqYoMp0vNZF96zJJyL254n-bL1MraNeXS-2sg',
  eclipse: '1jHhL0-7iVixI4w3fWFM4kJeS0R2bwoWfOjIt2n_E8SM',
  combo:   '1_M-P5Rw3-zOYZA1pdDHbzH_b42iEGR-O-c_NJI0oF0M'
};

const HOJAS = {
  summer:  {destino: 'Summer',  lectura: ['Summer'],  pagos: 'Pagos Summer'},
  eclipse: {destino: 'Eclipse', lectura: ['Eclipse'], pagos: 'Pagos Eclipse'},
  combo:   {destino: 'Combo',   lectura: ['Combo'],   pagos: 'Pagos Combo'}
};

const EVENTOS = {
  summer:  {nombre: '2ª Summer Open Water 2027',   prefijo: 'SOW27',   volver: 'https://openwater.ar/summer-open-water-2027.html'},
  eclipse: {nombre: 'OWeclipse 2027 · 2.5K',        prefijo: 'OWE27',   volver: 'https://openwater.ar/oweclipse-2027.html'},
  combo:   {nombre: 'Combo Summer + Eclipse 2027',  prefijo: 'COMBO27', volver: 'https://openwater.ar/index.html'}
};

/* Las 12 columnas fijas, en este orden, en las TRES hojas.
   No hay columna de "Categoría": la organización la calcula aparte con su
   propio script de clasificaciones (a veces faltan Género o fecha de
   nacimiento, así que no tiene sentido intentar derivarla acá). El texto de
   categoría que sí manda la ficha de Eclipse/Combo (cuero, neopreno, etc.) se
   guarda en "Notas" para no perderlo. */
const MASTER = ['Fecha de envío','Número de inscripto','Nombre y apellido','Género','Categoría adaptada','Teléfono','Email','DNI','CUIL','Fecha de nacimiento','Prueba','Ciudad','Club o equipo'];

const COLUMNAS_SUMMER = MASTER.concat(['Acepta reglamento','Apto médico','Compite también en Eclipse','Dinero entregado','Restante','Notas','Nacionalidad','Experiencia','Obra social','Grupo sanguíneo','Contacto de emergencia','Teléfono de emergencia','Observaciones médicas','Plan de pago','Monto','Forma de pago','Estado de pago','Referencia de pago','Uso de imagen','Aptitud física','No reembolsable','Competencia','Talle','Dispositivo de seguridad','Nada sin kit','Cupón']);

const COLUMNAS_ECLIPSE = MASTER.concat(['Acepta reglamento','Apto médico','Compite también en Summer','Dinero entregado','Restante','Notas','Cupón']);

const COLUMNAS_COMBO = MASTER.concat(['Pagado Summer','Restante Summer','Pagado Eclipse','Restante Eclipse','Notas','Origen']);

/* Diccionario aproximado, usado SOLO para leer hojas ajenas (sincronizarCombo,
   reordenarPlanillas) — nunca para decidir en qué columna se escribe. */
const COLUMNAS = {
  'DNI': ['dni', 'documento', 'pasaporte'],
  'CUIL': ['cuil', 'cuit'],
  'Nombre y apellido': ['apellido y nombre', 'nombre y apellido', 'nombre completo'],
  'Fecha de nacimiento': ['fecha de nacimiento', 'nacimiento'],
  'Ciudad': ['tu ciudad', 'ciudad', 'localidad'],
  'Club o equipo': ['club', 'equipo'],
  'Email': ['email', 'correo', 'mail'],
  'Teléfono': ['telefono', 'whatsapp', 'celular'],
  'Categoría': ['categoria']
};

/* ---------- Router ---------- */

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const ev = EVENTOS[d.evento] ? d.evento : 'eclipse';
    if (d.accion === 'crear')  return respuesta(crearPago(d, ev));
    if (d.accion === 'estado') return respuesta(estadoPago(d.ref, d.evento));
    if (d.accion === 'acreditar') return respuesta(acreditar(d));
    if (d.accion === 'generarCupon') return respuesta(generarCupon(d));
    if (d.accion === 'listarCupones') return respuesta(listarCupones(d));
    if (d.accion === 'validarCupon') return respuesta(validarCupon(d));
    if (d.accion === 'ficha')  { const cu = consumirCupon(d, ev); if (!cu.ok) return respuesta(cu); guardarFicha(d, ev); try { avisar(d, ev); } catch (errMail) { console.error('Mail: ' + errMail); } return respuesta({ok: true}); }
    return respuesta({ok: false, error: 'acción desconocida'});
  } catch (err) {
    return respuesta({ok: false, error: String(err)});
  }
}

function doGet() {
  return respuesta({ok: true, mensaje: 'Endpoint de inscripciones OW 2027 activo (summer · eclipse · combo).'});
}

/* ---------- Cupones de equipo (valor de equipo · solo contado) ----------
 * Hoja "Cupones" dentro de la planilla Combo: Código · Evento · Grupo · Usos permitidos · Usos hechos · Creado.
 * Se generan desde el botón privado "Cupones de equipo" de las listas de inscriptos.
 * Summer: solo Campeonato 5K+10K. Eclipse: única distancia. Sin cuotas. */
const CUPON_HEAD = ['Código', 'Evento', 'Grupo', 'Usos permitidos', 'Usos hechos', 'Creado'];

function hojaCupones() {
  const h = hoja('combo', 'Cupones');
  if (h.getLastRow() === 0) { h.appendRow(CUPON_HEAD); h.getRange(1, 1, 1, CUPON_HEAD.length).setFontWeight('bold'); h.setFrozenRows(1); }
  return h;
}

function generarCupon(d) {
  if (String(d.clave) !== CLAVE_ACREDITACION) return {ok: false, error: 'clave incorrecta'};
  if (d.evento !== 'summer' && d.evento !== 'eclipse') return {ok: false, error: 'evento inválido'};
  const usos = Math.floor(Number(d.usos));
  if (!(usos >= 1)) return {ok: false, error: 'cantidad inválida'};
  if (!String(d.grupo || '').trim()) return {ok: false, error: 'falta el equipo'};
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const h = hojaCupones();
    const existentes = h.getLastRow() > 1 ? h.getRange(2, 1, h.getLastRow() - 1, 1).getValues().map(function (f) { return String(f[0]); }) : [];
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c;
    do { c = ''; for (let i = 0; i < 6; i++) c += abc.charAt(Math.floor(Math.random() * abc.length)); } while (existentes.indexOf(c) !== -1);
    h.appendRow([c, d.evento, d.grupo || '', usos, 0, new Date().toLocaleString('es-AR')]);
    return {ok: true, codigo: c, usos: usos};
  } finally { lock.releaseLock(); }
}

function listarCupones(d) {
  if (String(d.clave) !== CLAVE_ACREDITACION) return {ok: false, error: 'clave incorrecta'};
  const h = hojaCupones();
  if (h.getLastRow() < 2) return {ok: true, cupones: []};
  const v = h.getRange(2, 1, h.getLastRow() - 1, 5).getValues();
  return {ok: true, cupones: v.filter(function (f) { return f[1] === d.evento; }).reverse().map(function (f) { return {codigo: f[0], grupo: f[2], usos: f[3], usados: f[4]}; })};
}

function buscarCupon(codigo, ev) {
  const cod = String(codigo || '').trim().toUpperCase();
  if (!cod) return null;
  const h = hojaCupones();
  if (h.getLastRow() < 2) return null;
  const v = h.getRange(2, 1, h.getLastRow() - 1, 5).getValues();
  for (let i = 0; i < v.length; i++) if (String(v[i][0]).toUpperCase() === cod && v[i][1] === ev) return {h: h, fila: i + 2, usos: Number(v[i][3]), usados: Number(v[i][4]), grupo: v[i][2]};
  return null;
}

function equipoCoincide(club, grupo) {
  const a = norm(club), b = norm(grupo);
  return !!a && !!b && (a === b || a.indexOf(b) !== -1 || b.indexOf(a) !== -1);
}

function validarCupon(d) {
  const c = buscarCupon(d.codigo, d.evento);
  if (!c) return {ok: false, error: 'Cupón inválido.'};
  if (c.usados >= c.usos) return {ok: false, error: 'Ese cupón ya se usó la cantidad de veces permitida.'};
  if (!equipoCoincide(d.club, c.grupo)) return {ok: false, error: 'El cupón fue generado para otro equipo. Revisá que el campo «Club o equipo» sea el del grupo que lo pidió.'};
  return {ok: true, restantes: c.usos - c.usados};
}

/** Si la ficha trae cupón: lo valida, exige contado y (en Summer) Campeonato, y descuenta un uso. */
function consumirCupon(d, ev) {
  const cod = d['Cupón'];
  if (!cod) return {ok: true};
  if (ev !== 'summer' && ev !== 'eclipse') return {ok: false, error: 'El cupón no aplica a este evento.'};
  if (ev === 'summer' && d['Prueba'] !== '5K+10K') return {ok: false, error: 'El cupón solo vale para Campeonato 5K + 10K.'};
  if (/cuota|financ/i.test(String(d['Plan de pago'] || ''))) return {ok: false, error: 'El cupón solo vale con pago contado.'};
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const c = buscarCupon(cod, ev);
    if (!c) return {ok: false, error: 'Cupón inválido.'};
    if (c.usados >= c.usos) return {ok: false, error: 'Ese cupón ya se usó la cantidad de veces permitida.'};
    if (!equipoCoincide(d['Club o equipo'], c.grupo)) return {ok: false, error: 'El cupón fue generado para otro equipo. Revisá el campo «Club o equipo».'};
    c.h.getRange(c.fila, 5).setValue(c.usados + 1);
    d['Notas'] = (d['Notas'] ? d['Notas'] + ' · ' : '') + 'Cupón equipo ' + String(cod).toUpperCase() + ' (valor equipo, ' + (c.grupo || 'grupo') + ')';
    return {ok: true};
  } finally { lock.releaseLock(); }
}

/* ---------- Mercado Pago ---------- */

function crearPago(d, ev) {
  const cfg = EVENTOS[ev];
  const ref = cfg.prefijo + '-' + d.dni + '-' + Date.now();
  const monto = PRUEBA ? 10 : Number(d.monto);
  const cuerpo = {
    items: [{title: cfg.nombre + ' · ' + d.plan, quantity: 1, currency_id: 'ARS', unit_price: monto}],
    payer: {name: d.nombre, email: d.email},
    external_reference: ref,
    statement_descriptor: 'OPENWATER',
    back_urls: {success: cfg.volver},
    metadata: {dni: d.dni, plan: d.plan, evento: ev}
  };
  const r = UrlFetchApp.fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'post', contentType: 'application/json',
    headers: {Authorization: 'Bearer ' + ACCESS_TOKEN},
    payload: JSON.stringify(cuerpo), muteHttpExceptions: true
  });
  const j = JSON.parse(r.getContentText());
  if (!j.init_point) return {ok: false, error: j.message || 'Mercado Pago rechazó la solicitud'};
  registrarIntento(ev, ref, d, monto);
  return {ok: true, ref: ref, link: j.init_point, monto: monto};
}

function estadoPago(ref, evento) {
  const url = 'https://api.mercadopago.com/v1/payments/search?external_reference=' + encodeURIComponent(ref);
  const r = UrlFetchApp.fetch(url, {headers: {Authorization: 'Bearer ' + ACCESS_TOKEN}, muteHttpExceptions: true});
  const j = JSON.parse(r.getContentText());
  const pagos = j.results || [];
  let estado = 'pending';
  pagos.forEach(function (p) {
    if (p.status === 'approved') estado = 'approved';
    else if (p.status === 'rejected' && estado !== 'approved') estado = 'rejected';
  });
  const ev = EVENTOS[evento] ? evento : refAEvento(ref);
  if (estado === 'approved' && ev) marcarPagado(ev, ref, pagos[0]);
  return {ok: true, estado: estado};
}

function refAEvento(ref) {
  const p = String(ref).split('-')[0];
  for (const k in EVENTOS) if (EVENTOS[k].prefijo === p) return k;
  return null;
}

/* ---------- Utilidades compartidas ---------- */

function norm(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

/** "Mujer cuero" / "Mujer 21-30" → "Mujer". Si no reconoce nada, devuelve el texto tal cual. */
function generoDesdeTexto(s) {
  s = String(s || '');
  if (/mujer/i.test(s)) return 'Mujer';
  if (/hombre/i.test(s)) return 'Hombre';
  return s;
}

/** Cualquier texto de prueba → "2K", "5K", "10K" o "5K+10K". */
function normalizarDistancia(v) {
  const s = String(v || '');
  if (/10\s*K/i.test(s) && /5\s*K/i.test(s)) return '5K+10K';
  if (/10\s*K/i.test(s)) return '10K';
  if (/5\s*K/i.test(s)) return '5K';
  if (/2\s*K/i.test(s)) return '2K';
  return s;
}

function notasExtra(pares) {
  return pares
    .filter(function (p) { return p && p[1] !== undefined && p[1] !== null && String(p[1]).trim() !== ''; })
    .map(function (p) { return p[0] ? (p[0] + ': ' + p[1]) : p[1]; })
    .join(' · ');
}

/* ---------- Acceso a las hojas ---------- */

function hoja(evento, nombre) {
  const ss = SpreadsheetApp.openById(PLANILLAS[evento]);
  return ss.getSheetByName(nombre) || ss.insertSheet(nombre);
}

function hojaSiExiste(evento, nombre) {
  return SpreadsheetApp.openById(PLANILLAS[evento]).getSheetByName(nombre);
}

/**
 * Escribe una fila SIEMPRE en las columnas oficiales de `columnasOficiales`,
 * ubicadas por coincidencia EXACTA de encabezado. Si la hoja está vacía, la
 * crea con esos encabezados, en ese orden. Calcula solo "Número de inscripto"
 * si esa columna existe y no vino en `datos`. Nunca agrega columnas nuevas.
 */
function escribirExacto(h, columnasOficiales, datos) {
  if (h.getLastRow() === 0) {
    h.appendRow(columnasOficiales);
    h.setFrozenRows(1);
    h.getRange(1, 1, 1, columnasOficiales.length).setFontWeight('bold');
  }
  if (columnasOficiales.indexOf('Número de inscripto') !== -1 && !datos['Número de inscripto']) {
    /* Próximo Nº = mayor número existente + 1 (no depende de la cantidad de filas,
       así borrar un inscripto NO renumera a los demás ni repite números). */
    let max = 0;
    if (h.getLastRow() > 1) {
      const cab0 = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(norm);
      const iNum = cab0.indexOf(norm('Número de inscripto'));
      if (iNum !== -1) h.getRange(2, iNum + 1, h.getLastRow() - 1, 1).getValues().forEach(function (f) { const x = Number(f[0]); if (!isNaN(x) && x > max) max = x; });
    }
    datos['Número de inscripto'] = max + 1;
  }
  const cab = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0];
  const cabNorm = cab.map(norm);
  const fila = new Array(cab.length).fill('');
  Object.keys(datos).forEach(function (k) {
    const i = cabNorm.indexOf(norm(k));
    if (i !== -1) fila[i] = datos[k];
  });
  h.appendRow(fila);
}

/* ---------- Filas oficiales por hoja (fichas nuevas) ---------- */

function filaSummerOficial(d, cruzada) {
  const adaptada = d['Categoría adaptada'] === 'Sí' ? 'Sí' : 'No';
  return {
    'Fecha de envío': d['Fecha de envío'] || new Date().toLocaleString('es-AR'),
    'Nombre y apellido': d['Nombre y apellido'] || '',
    'Género': d['Género'] || '',
    'Categoría adaptada': adaptada,
    'Teléfono': d['Teléfono'] || '',
    'Email': d['Email'] || '',
    'DNI': d['DNI'] || '',
    'CUIL': d['CUIL'] || '',
    'Fecha de nacimiento': d['Fecha de nacimiento'] || '',
    'Prueba': cruzada ? '5K+10K' : normalizarDistancia(d['Prueba']),
    'Ciudad': d['Ciudad'] || '',
    'Club o equipo': d['Club o equipo'] || '',
    'Acepta reglamento': d['Acepta reglamento'] || d['Acepta reglamento Summer'] || '',
    'Apto médico': d['Apto médico'] || '',
    'Compite también en Eclipse': cruzada ? 'Sí' : '',
    'Nacionalidad': d['Nacionalidad'] || '',
    'Experiencia': d['Experiencia'] || '',
    'Obra social': d['Obra social'] || '',
    'Grupo sanguíneo': d['Grupo sanguíneo'] || '',
    'Contacto de emergencia': d['Contacto de emergencia'] || '',
    'Teléfono de emergencia': d['Teléfono de emergencia'] || '',
    'Observaciones médicas': d['Observaciones médicas'] || '',
    'Plan de pago': cruzada ? (d['Plan de pago'] || '') + ' (combo)' : (d['Plan de pago'] || ''),
    'Monto': cruzada ? 'Incluido en combo (' + (d['Total del combo'] || d['Monto'] || '') + ')' : (d['Monto'] || ''),
    'Forma de pago': d['Forma de pago'] || '',
    'Estado de pago': d['Estado de pago'] || '',
    'Referencia de pago': d['Referencia de pago'] || d['Número de operación'] || '',
    'Uso de imagen': d['Uso de imagen'] || '',
    'Aptitud física': d['Aptitud física'] || '',
    'No reembolsable': d['No reembolsable'] || '',
    'Competencia': EVENTOS.summer.nombre,
    'Talle': cruzada ? (d['Talle poncho Summer'] || '') : (d['Talle'] || ''),
    'Dispositivo de seguridad': d['Dispositivo de seguridad'] || '',
    'Nada sin kit': d['Nada sin kit'] || '',
    'Cupón': d['Cupón'] || '',
    'Notas': notasExtra([
      ['Titular transferencia', d['Titular de la transferencia']],
      ['Fecha transferencia', d['Fecha de transferencia']],
      cruzada ? ['Origen', 'Combo Summer + Eclipse'] : null
    ])
  };
}

function filaEclipseOficial(d, cruzada) {
  const cat = cruzada ? (d['Categoría Eclipse'] || '') : (d['Categoría'] || '');
  const genero = d['Género'] || generoDesdeTexto(cat);
  const adaptada = d['Categoría adaptada'] === 'Sí' ? 'Sí' : 'No';
  return {
    'Fecha de envío': d['Fecha de envío'] || new Date().toLocaleString('es-AR'),
    'Nombre y apellido': d['Nombre y apellido'] || '',
    'Género': genero,
    'Categoría adaptada': adaptada,
    'Teléfono': d['Teléfono'] || '',
    'Email': d['Email'] || '',
    'DNI': d['DNI'] || '',
    'CUIL': d['CUIL'] || '',
    'Fecha de nacimiento': d['Fecha de nacimiento'] || '',
    'Prueba': '2.5K',
    'Ciudad': d['Ciudad'] || '',
    'Club o equipo': d['Club o equipo'] || '',
    'Acepta reglamento': d['Acepta reglamento'] || d['Acepta reglamento Eclipse'] || '',
    'Apto médico': d['Apto médico'] || '',
    'Compite también en Summer': cruzada ? 'Sí' : '',
    'Cupón': d['Cupón'] || '',
    'Notas': notasExtra([
      ['Categoría de premiación', cat],
      ['Talle', cruzada ? d['Talle remera Eclipse'] : d['Talle']],
      ['Nacionalidad', d['Nacionalidad']],
      ['Experiencia', d['Experiencia']],
      ['Obra social', d['Obra social']],
      ['Grupo sanguíneo', d['Grupo sanguíneo']],
      ['Contacto emergencia', d['Contacto de emergencia']],
      ['Tel. emergencia', d['Teléfono de emergencia']],
      ['Obs. médicas', d['Observaciones médicas']],
      ['', d['Lentes de eclipse'] === 'Sí' ? '[LENTES]' : ''],
      ['Monto lentes', d['Monto lentes'] && d['Monto lentes'] !== '$0' ? d['Monto lentes'] : ''],
      ['Riesgo solar', d['Riesgo solar']],
      ['Uso de imagen', d['Uso de imagen']],
      ['No reembolsable', d['No reembolsable']],
      ['Plan', cruzada ? (d['Plan de pago'] || '') + ' (combo)' : d['Plan de pago']],
      ['Monto', cruzada ? 'Incluido en combo (' + (d['Total del combo'] || d['Monto'] || '') + ')' : d['Monto']],
      ['Forma de pago', d['Forma de pago']],
      ['Estado de pago', d['Estado de pago']],
      ['Referencia de pago', d['Referencia de pago'] || d['Número de operación']],
      ['Titular transferencia', d['Titular de la transferencia']],
      ['Fecha transferencia', d['Fecha de transferencia']],
      cruzada ? ['Origen', 'Combo Summer + Eclipse'] : null
    ])
  };
}

function filaComboOficial(d) {
  return {
    'Fecha de envío': d['Fecha de envío'] || new Date().toLocaleString('es-AR'),
    'Nombre y apellido': d['Nombre y apellido'] || '',
    'Género': d['Género'] || generoDesdeTexto(d['Categoría Eclipse']) || '',
    'Categoría adaptada': d['Categoría adaptada'] === 'Sí' ? 'Sí' : 'No',
    'Teléfono': d['Teléfono'] || '',
    'Email': d['Email'] || '',
    'DNI': d['DNI'] || '',
    'CUIL': d['CUIL'] || '',
    'Fecha de nacimiento': d['Fecha de nacimiento'] || '',
    'Prueba': '5K+10K',
    'Ciudad': d['Ciudad'] || '',
    'Club o equipo': d['Club o equipo'] || '',
    'Origen': 'Ficha del combo',
    'Notas': notasExtra([
      ['Categoría de edad', d['Categoría de edad']],
      ['Categoría Eclipse', d['Categoría Eclipse']],
      ['Talle poncho', d['Talle poncho Summer']],
      ['Talle remera', d['Talle remera Eclipse']],
      ['Plan', d['Plan de pago']],
      ['Monto pagado ahora', d['Monto']],
      ['Total del combo', d['Total del combo']],
      ['Forma de pago', d['Forma de pago']],
      ['Estado de pago', d['Estado de pago']],
      ['Referencia de pago', d['Referencia de pago'] || d['Número de operación']],
      ['Experiencia', d['Experiencia']],
      ['Contacto emergencia', d['Contacto de emergencia']],
      ['Tel. emergencia', d['Teléfono de emergencia']],
      ['Obs. médicas', d['Observaciones médicas']],
      ['Grupo', d['Grupo']],
      ['Responsable grupo', d['Responsable del grupo']],
      ['Titular transferencia', d['Titular de la transferencia']],
      ['Fecha transferencia', d['Fecha de transferencia']]
    ])
  };
}

function guardarFicha(d, ev) {
  if (ev === 'summer')  { escribirExacto(hoja('summer', HOJAS.summer.destino), COLUMNAS_SUMMER, filaSummerOficial(d, false)); return; }
  if (ev === 'eclipse') { escribirExacto(hoja('eclipse', HOJAS.eclipse.destino), COLUMNAS_ECLIPSE, filaEclipseOficial(d, false)); return; }
  /* combo: las tres hojas */
  escribirExacto(hoja('combo', HOJAS.combo.destino), COLUMNAS_COMBO, filaComboOficial(d));
  escribirExacto(hoja('summer', HOJAS.summer.destino), COLUMNAS_SUMMER, filaSummerOficial(d, true));
  escribirExacto(hoja('eclipse', HOJAS.eclipse.destino), COLUMNAS_ECLIPSE, filaEclipseOficial(d, true));
}

/* ---------- Acreditación (desde las páginas de inscriptos) ----------
 * {accion:'acreditar', evento, clave, dni, nombre, estado?, monto?}
 *   estado: 'ok' → agrega [ACREDITADO] en "Notas" · '' → quita la marca · 'no' → BORRA la fila de la hoja (sin renumerar)
 *   monto:  número → lo escribe en "Dinero entregado" (Summer/Eclipse) o como [ABONADO $x] en "Notas" (Combo)
 * No agrega columnas. En el combo, la acción se replica en las hojas Combo, Summer y Eclipse.
 */
function acreditar(d) {
  if (String(d.clave) !== CLAVE_ACREDITACION) return {ok: false, error: 'clave incorrecta'};
  const destinos = d.evento === 'combo' ? ['combo', 'summer', 'eclipse'] : [d.evento];
  const dni = String(d.dni || '').replace(/\D/g, '');
  const nom = norm(d.nombre);
  let tocadas = 0;
  destinos.forEach(function (ev) {
    if (!HOJAS[ev]) return;
    const h = hojaSiExiste(ev, HOJAS[ev].destino);
    if (!h || h.getLastRow() < 2) return;
    const v = h.getDataRange().getValues();
    const cab = v[0].map(norm);
    const iDni = cab.indexOf('dni'), iNom = cab.indexOf('nombre y apellido');
    const iNotas = cab.indexOf('notas'), iDin = cab.indexOf('dinero entregado');
    for (let r = 1; r < v.length; r++) {
      const okDni = dni && iDni !== -1 && String(v[r][iDni]).replace(/\D/g, '') === dni;
      const okNom = !dni && iNom !== -1 && norm(v[r][iNom]) === nom;
      if (!okDni && !okNom) continue;
      if (d.estado === 'no') { h.deleteRow(r + 1); tocadas++; break; }
      if (iNotas !== -1) {
        let n = String(v[r][iNotas] || '');
        if (d.estado !== undefined) {
          n = n.replace(/\s*\[(ACREDITADO|NO SE PRESENTÓ)\]/g, '').trim();
          if (d.estado === 'ok') n = (n + ' [ACREDITADO]').trim();
          if (d.estado === 'no') n = (n + ' [NO SE PRESENTÓ]').trim();
        }
        if (d.monto !== undefined && (ev === 'combo' || iDin === -1)) {
          n = n.replace(/\s*\[ABONADO[^\]]*\]/g, '').trim();
          if (String(d.monto).trim()) n = (n + ' [ABONADO $' + d.monto + ']').trim();
        }
        h.getRange(r + 1, iNotas + 1).setValue(n);
      }
      if (d.monto !== undefined && ev !== 'combo' && iDin !== -1) {
        h.getRange(r + 1, iDin + 1).setValue(String(d.monto).trim() ? Number(d.monto) : '');
      }
      tocadas++;
      break;
    }
  });
  return tocadas ? {ok: true} : {ok: false, error: 'no encontré al nadador en la planilla'};
}

/* ---------- Pagos ---------- */

function registrarIntento(ev, ref, d, monto) {
  const h = hoja(ev, HOJAS[ev].pagos);
  if (h.getLastRow() === 0) h.appendRow(['Referencia', 'Fecha', 'Nombre', 'DNI', 'Email', 'Plan', 'Monto', 'Estado', 'ID de pago']);
  h.appendRow([ref, new Date(), d.nombre, d.dni, d.email, d.plan, monto, 'pendiente', '']);
}

function marcarPagado(ev, ref, pago) {
  const h = hoja(ev, HOJAS[ev].pagos);
  const v = h.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][0]) === ref && v[i][7] !== 'pagado') {
      h.getRange(i + 1, 8).setValue('pagado');
      h.getRange(i + 1, 9).setValue(pago ? pago.id : '');
      return;
    }
  }
}

/* ---------- Sincronización del combo ----------
 * Agrega a la hoja del Combo a quien esté en Summer Y en Eclipse. Compara por
 * DNI (o por nombre si falta el DNI). No duplica.
 */

function buscarColumnaAprox(cabNorm, clave) {
  const alias = COLUMNAS[clave] || [norm(clave)];
  for (let i = 0; i < cabNorm.length; i++) {
    for (let a = 0; a < alias.length; a++) {
      if (cabNorm[i] && cabNorm[i].indexOf(alias[a]) !== -1) return i;
    }
  }
  return -1;
}

function leerInscriptos(evento) {
  const out = {};
  HOJAS[evento].lectura.forEach(function (nombre) {
    const h = hojaSiExiste(evento, nombre);
    if (!h || h.getLastRow() < 2) return;
    const v = h.getDataRange().getValues();
    const cabNorm = v[0].map(norm);
    const iDni = buscarColumnaAprox(cabNorm, 'DNI');
    const iNom = buscarColumnaAprox(cabNorm, 'Nombre y apellido');
    const iMail = buscarColumnaAprox(cabNorm, 'Email');
    const iTel = buscarColumnaAprox(cabNorm, 'Teléfono');
    const iCiu = buscarColumnaAprox(cabNorm, 'Ciudad');
    const iClub = buscarColumnaAprox(cabNorm, 'Club o equipo');
    const iCat = buscarColumnaAprox(cabNorm, 'Categoría');
    const iGen = cabNorm.indexOf(norm('Género'));
    const iPrueba = cabNorm.indexOf(norm('Prueba'));
    const iNac = buscarColumnaAprox(cabNorm, 'Fecha de nacimiento');
    const iCuil = buscarColumnaAprox(cabNorm, 'CUIL');
    for (let r = 1; r < v.length; r++) {
      const dni = iDni === -1 ? '' : String(v[r][iDni]).replace(/\D/g, '');
      const nom = iNom === -1 ? '' : String(v[r][iNom]).trim();
      if (!dni && !nom) continue;
      const clave = dni || norm(nom);
      out[clave] = {
        clave: clave, dni: dni, nombre: nom,
        email: iMail === -1 ? '' : v[r][iMail],
        telefono: iTel === -1 ? '' : v[r][iTel],
        ciudad: iCiu === -1 ? '' : v[r][iCiu],
        club: iClub === -1 ? '' : v[r][iClub],
        categoria: iCat === -1 ? '' : v[r][iCat],
        genero: iGen === -1 ? '' : v[r][iGen],
        prueba: iPrueba === -1 ? '' : v[r][iPrueba],
        nacimiento: iNac === -1 ? '' : v[r][iNac],
        cuil: iCuil === -1 ? '' : v[r][iCuil],
        hoja: nombre
      };
    }
  });
  return out;
}

function sincronizarCombo() {
  const s = leerInscriptos('summer');
  const e = leerInscriptos('eclipse');
  const hc = hoja('combo', HOJAS.combo.destino);

  const ya = {};
  if (hc.getLastRow() > 1) {
    const v = hc.getDataRange().getValues();
    const cabNorm = v[0].map(norm);
    const iDni = cabNorm.indexOf(norm('DNI'));
    const iNom = cabNorm.indexOf(norm('Nombre y apellido'));
    for (let r = 1; r < v.length; r++) {
      const dni = iDni === -1 ? '' : String(v[r][iDni]).replace(/\D/g, '');
      const nom = iNom === -1 ? '' : String(v[r][iNom]).trim();
      if (dni) ya[dni] = true;
      if (nom) ya[norm(nom)] = true;
    }
  }

  const sumados = [];
  Object.keys(s).forEach(function (k) {
    if (ya[k] || !e[k]) return;
    const p = e[k], q = s[k];
    escribirExacto(hc, COLUMNAS_COMBO, {
      'Nombre y apellido': p.nombre || q.nombre || '',
      'Género': q.genero || generoDesdeTexto(p.categoria) || '',
      'DNI': p.dni || q.dni || '',
      'CUIL': p.cuil || q.cuil || '',
      'Fecha de nacimiento': p.nacimiento || q.nacimiento || '',
      'Prueba': normalizarDistancia(q.prueba) || '5K+10K',
      'Ciudad': p.ciudad || q.ciudad || '',
      'Club o equipo': p.club || q.club || '',
      'Teléfono': p.telefono || q.telefono || '',
      'Email': p.email || q.email || '',
      'Origen': 'Detectado en ambas planillas (' + q.hoja + ' + ' + p.hoja + ')'
    });
    ya[k] = true;
    sumados.push(p.nombre || q.nombre || k);
  });

  if (sumados.length) {
    MailApp.sendEmail(DESTINO, 'Combo 2027 · ' + sumados.length + ' nadador(es) sumados a la hoja del combo',
      'La sincronización agregó a la hoja "Combo":\n\n· ' + sumados.join('\n· ') +
      '\n\nRevisá el pago de cada uno: el combo tiene su propio valor.\n');
  }
  return sumados;
}

/* ---------- Corrección de las hojas ya existentes ----------
 * Reconstruye cada hoja con la estructura estricta (MASTER + el resto de sus
 * columnas propias), numerando correlativamente a los ya cargados y
 * normalizando Género / Categoría / Prueba a partir de lo que cada hoja ya
 * tenía. Se corre UNA VEZ desde el editor de Apps Script.
 */

function reordenarPlanillas() {
  reordenarHoja('summer', HOJAS.summer.destino, COLUMNAS_SUMMER, mapearFilaSummerExistente);
  reordenarHoja('eclipse', HOJAS.eclipse.destino, COLUMNAS_ECLIPSE, mapearFilaEclipseExistente);
  reordenarHoja('combo', HOJAS.combo.destino, COLUMNAS_COMBO, mapearFilaComboExistente);
}

function reordenarHoja(evento, nombreHoja, columnasNuevas, mapear) {
  const h = hojaSiExiste(evento, nombreHoja);
  if (!h || h.getLastRow() < 2) return;
  const v = h.getDataRange().getValues();
  const cab = v[0];
  const filasViejas = v.slice(1).map(function (fila) {
    const obj = {};
    cab.forEach(function (c, i) { obj[c] = fila[i]; });
    return obj;
  });
  const filasNuevas = filasViejas.map(function (viejo, idx) { return mapear(viejo, idx + 1); });
  h.clearContents();
  h.getRange(1, 1, 1, columnasNuevas.length).setValues([columnasNuevas]).setFontWeight('bold');
  h.setFrozenRows(1);
  const matriz = filasNuevas.map(function (obj) {
    return columnasNuevas.map(function (c) { return obj[c] !== undefined ? obj[c] : ''; });
  });
  if (matriz.length) h.getRange(2, 1, matriz.length, columnasNuevas.length).setValues(matriz);
}

function mapearFilaSummerExistente(v, numero) {
  return {
    'Fecha de envío': v['Fecha de envío'] || '',
    'Número de inscripto': numero,
    'Nombre y apellido': v['Nombre y apellido'] || '',
    'Género': v['Género'] || '',
    'Categoría adaptada': v['Categoría adaptada'] || 'No',
    'Teléfono': v['Teléfono'] || '',
    'Email': v['Email'] || '',
    'DNI': v['DNI'] || '',
    'CUIL': v['CUIL'] || '',
    'Fecha de nacimiento': v['Fecha de nacimiento'] || '',
    'Prueba': normalizarDistancia(v['Prueba']),
    'Ciudad': v['Ciudad'] || '',
    'Club o equipo': v['Club o equipo'] || '',
    'Acepta reglamento': v['Acepta reglamento'] || '',
    'Apto médico': v['Apto médico'] || '',
    'Compite también en Eclipse': v['Compite también en Eclipse'] || '',
    'Dinero entregado': v['Dinero entregado'] || '',
    'Restante': v['Restante'] || '',
    'Notas': v['Notas'] || '',
    'Nacionalidad': v['Nacionalidad'] || '',
    'Experiencia': v['Experiencia'] || '',
    'Obra social': v['Obra social'] || '',
    'Grupo sanguíneo': v['Grupo sanguíneo'] || '',
    'Contacto de emergencia': v['Contacto de emergencia'] || '',
    'Teléfono de emergencia': v['Teléfono de emergencia'] || '',
    'Observaciones médicas': v['Observaciones médicas'] || '',
    'Plan de pago': v['Plan de pago'] || '',
    'Monto': v['Monto'] || '',
    'Forma de pago': v['Forma de pago'] || '',
    'Estado de pago': v['Estado de pago'] || '',
    'Referencia de pago': v['Referencia de pago'] || '',
    'Uso de imagen': v['Uso de imagen'] || '',
    'Aptitud física': v['Aptitud física'] || '',
    'No reembolsable': v['No reembolsable'] || '',
    'Competencia': v['Competencia'] || '',
    'Talle': v['Talle'] || '',
    'Dispositivo de seguridad': v['Dispositivo de seguridad'] || '',
    'Nada sin kit': v['Nada sin kit'] || ''
  };
}

function mapearFilaEclipseExistente(v, numero) {
  const genero = v['Género'] || generoDesdeTexto(v['Categoría']) || generoDesdeTexto(v['Notas']) || '';
  return {
    'Fecha de envío': v['Fecha de envío'] || '',
    'Número de inscripto': numero,
    'Nombre y apellido': v['Nombre y apellido'] || '',
    'Género': genero,
    'Categoría adaptada': v['Categoría adaptada'] || 'No',
    'Teléfono': v['Teléfono'] || '',
    'Email': v['Email'] || '',
    'DNI': v['DNI'] || '',
    'CUIL': v['CUIL'] || '',
    'Fecha de nacimiento': v['Fecha de nacimiento'] || '',
    'Prueba': '2.5K',
    'Ciudad': v['Ciudad'] || '',
    'Club o equipo': v['Club o equipo'] || '',
    'Acepta reglamento': v['Acepta reglamento'] || '',
    'Apto médico': v['Apto médico'] || '',
    'Compite también en Summer': v['Compite también en Summer'] || '',
    'Dinero entregado': v['Dinero entregado'] || '',
    'Restante': v['Restante'] || '',
    'Notas': notasExtra([['Categoría de premiación', v['Categoría']], [null, v['Notas']]])
  };
}

function mapearFilaComboExistente(v, numero) {
  const genero = v['Género'] || generoDesdeTexto(v['Categoría Summer']) || generoDesdeTexto(v['Categoría Eclipse']) || generoDesdeTexto(v['Notas']) || '';
  return {
    'Fecha de envío': v['Fecha de envío'] || '',
    'Número de inscripto': numero,
    'Nombre y apellido': v['Nombre y apellido'] || '',
    'Género': genero,
    'Categoría adaptada': v['Categoría adaptada'] || 'No',
    'Teléfono': v['Teléfono'] || '',
    'Email': v['Email'] || '',
    'DNI': v['DNI'] || '',
    'CUIL': v['CUIL'] || '',
    'Fecha de nacimiento': v['Fecha de nacimiento'] || '',
    'Prueba': normalizarDistancia(v['Prueba Summer']) || '5K+10K',
    'Ciudad': v['Ciudad'] || '',
    'Club o equipo': v['Club o equipo'] || '',
    'Pagado Summer': v['Pagado Summer'] || '',
    'Restante Summer': v['Restante Summer'] || '',
    'Pagado Eclipse': v['Pagado Eclipse'] || '',
    'Restante Eclipse': v['Restante Eclipse'] || '',
    'Notas': notasExtra([['Categoría Eclipse', v['Categoría Eclipse']], [null, v['Notas']]]),
    'Origen': v['Origen'] || ''
  };
}

/* ---------- Emails ---------- */

const SITIO = 'https://openwater.ar/';
const WHATSAPP_COMUNIDAD = 'https://chat.whatsapp.com/KGV5qfDdpQKAXBBpuE45IA';
const TELEFONOS = ['+54 9 2920 650486', '+54 9 2920 352579'];
const LOGOS = {
  summer:  [{src: SITIO + 'logo-summer-email.png',  alt: 'Summer Open Water'}],
  eclipse: [{src: SITIO + 'logo-eclipse-email.png', alt: 'OW Eclipse'}],
  combo:   [{src: SITIO + 'logo-summer-email.png',  alt: 'Summer Open Water'}, {src: SITIO + 'logo-eclipse-email.png', alt: 'OW Eclipse'}]
};
const COLOR_EVENTO = {summer: '#12688f', eclipse: '#C0271A', combo: '#c9a24d'};

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br>');
}

function grupoDeCampo(k) {
  if (/pago|monto|total|operaci|transfer|reembols|cuota/i.test(k)) return 'Inscripción y pago';
  if (/salud|emergencia|m[eé]dic|sangu|obra social|experiencia|aptitud|solar|apto|dispositivo/i.test(k)) return 'Salud y contacto de emergencia';
  return 'Datos del nadador';
}

/** HTML del mail: logos según evento, TODOS los campos de la ficha, agradecimiento, teléfonos y WhatsApp. */
function htmlMail(d, ev, paraOrganizacion) {
  const cfg = EVENTOS[ev];
  const color = COLOR_EVENTO[ev];
  const nombre = d['Nombre y apellido'] || '';
  const esCombo = ev === 'combo';

  const logos = LOGOS[ev].map(function (l) {
    return '<td style="padding:0 10px;"><img src="' + l.src + '" alt="' + esc(l.alt) + '" height="92" style="display:block;height:92px;width:auto;border:0;"></td>';
  }).join('');

  const grupos = {'Datos del nadador': [], 'Salud y contacto de emergencia': [], 'Inscripción y pago': []};
  Object.keys(d).forEach(function (k) {
    if (k === 'accion' || k === 'evento') return;
    const v = d[k];
    grupos[grupoDeCampo(k)].push([k, v === '' || v == null ? '—' : v]);
  });
  const bloques = Object.keys(grupos).filter(function (g) { return grupos[g].length; }).map(function (g) {
    const filas = grupos[g].map(function (p, i) {
      return '<tr><td style="padding:8px 12px;width:38%;font:600 12px Arial,Helvetica,sans-serif;color:#5b6b75;background:' + (i % 2 ? '#f6f9fb' : '#ffffff') + ';border-bottom:1px solid #e6edf1;vertical-align:top;">' + esc(p[0]) + '</td>' +
             '<td style="padding:8px 12px;font:14px Arial,Helvetica,sans-serif;color:#0a2438;background:' + (i % 2 ? '#f6f9fb' : '#ffffff') + ';border-bottom:1px solid #e6edf1;vertical-align:top;">' + esc(p[1]) + '</td></tr>';
    }).join('');
    return '<tr><td style="padding:22px 28px 0;"><div style="font:700 13px Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase;color:' + color + ';padding-bottom:8px;border-bottom:2px solid ' + color + ';">' + esc(g) + '</div>' +
           '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e6edf1;border-top:0;">' + filas + '</table></td></tr>';
  }).join('');

  const resumen = esCombo
    ? 'Con esta ficha quedás anotado en las dos competencias:<br><b>2ª Summer Open Water</b>: 5K (sábado 23 de enero), 10K (domingo 24) y 2K Travel Night Fest, en Patagones – Viedma.<br><b>OWeclipse</b>: 2.500 m el sábado 6 de febrero en Las Grutas, largada 10:31:40 hs.<br>No hace falta completar los formularios individuales.'
    : 'Recibimos tu inscripción a <b>' + esc(cfg.nombre) + '</b>.';
  const apto = 'Recordá presentar el apto médico vigente en la acreditación' +
    (esCombo || ev === 'eclipse' ? ' (para OWeclipse, con máximo 3 meses de antigüedad a la fecha de la competencia)' : '') + '.';

  const intro = paraOrganizacion
    ? '<div style="font:700 18px Arial,Helvetica,sans-serif;color:#0a2438;">Nueva inscripción: ' + esc(nombre) + '</div><div style="font:14px/1.6 Arial,Helvetica,sans-serif;color:#3b5b67;margin-top:6px;">' + esc(cfg.nombre) + (esCombo ? ' (queda cargada también en las hojas de Summer y de Eclipse)' : '') + '. Estos son todos los campos que completó el nadador.</div>'
    : '<div style="font:700 20px Arial,Helvetica,sans-serif;color:#0a2438;">Hola ' + esc(nombre) + ',</div><div style="font:15px/1.6 Arial,Helvetica,sans-serif;color:#3b5b67;margin-top:8px;">' + resumen + '<br><br>Plan de pago: <b>' + esc(d['Plan de pago'] || '—') + '</b> · Estado del pago: <b>' + esc(d['Estado de pago'] || '—') + '</b><br>' + apto + '<br><br>Estos son los datos que registramos en tu ficha:</div>';

  const cierre = paraOrganizacion ? '' :
    '<tr><td style="padding:30px 28px 8px;text-align:center;">' +
    '<div style="font:700 26px Arial,Helvetica,sans-serif;color:' + color + ';">¡Gracias por inscribirte!</div>' +
    '<div style="font:16px/1.6 Arial,Helvetica,sans-serif;color:#0a2438;margin-top:8px;">Te esperamos para esta nueva aventura.</div></td></tr>' +
    '<tr><td style="padding:14px 28px 6px;text-align:center;"><a href="' + WHATSAPP_COMUNIDAD + '" style="display:inline-block;background:#25D366;color:#ffffff;font:700 15px Arial,Helvetica,sans-serif;text-decoration:none;padding:14px 28px;border-radius:999px;">Sumate al grupo de la comunidad Open Water en WhatsApp</a></td></tr>';

  const contacto =
    '<tr><td style="padding:22px 28px 30px;text-align:center;"><div style="font:700 12px Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#5b6b75;">Contacto</div>' +
    '<div style="font:15px/1.8 Arial,Helvetica,sans-serif;color:#0a2438;margin-top:6px;">' + TELEFONOS.map(function (t) { return esc(t); }).join(' &nbsp;·&nbsp; ') +
    '<br><a href="mailto:' + DESTINO + '" style="color:' + color + ';text-decoration:none;">' + DESTINO + '</a> &nbsp;·&nbsp; <a href="https://openwater.ar" style="color:' + color + ';text-decoration:none;">openwater.ar</a></div></td></tr>';

  return '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#e9eff3;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e9eff3;"><tr><td align="center" style="padding:24px 10px;">' +
    '<table role="presentation" width="620" cellpadding="0" cellspacing="0" style="width:100%;max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;">' +
    '<tr><td align="center" style="background:#f4f8fb;padding:26px 20px 18px;border-bottom:4px solid ' + color + ';">' +
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' + logos + '</tr></table>' +
    '<div style="font:700 22px Arial,Helvetica,sans-serif;letter-spacing:3px;color:#0a2438;margin-top:14px;">OPEN WATER RÍO NEGRO</div>' +
    '<div style="font:700 14px Arial,Helvetica,sans-serif;color:' + color + ';letter-spacing:1px;margin-top:4px;">' + esc(cfg.nombre) + '</div></td></tr>' +
    '<tr><td style="padding:26px 28px 0;">' + intro + '</td></tr>' +
    bloques + cierre + contacto +
    '</table></td></tr></table></body></html>';
}

function textoMail(d, ev, paraOrganizacion) {
  const nombre = d['Nombre y apellido'] || '';
  let s = paraOrganizacion ? 'Nueva inscripción · ' + EVENTOS[ev].nombre + '\n\n' : 'Hola ' + nombre + ', recibimos tu inscripción a ' + EVENTOS[ev].nombre + '. Estos son tus datos:\n\n';
  Object.keys(d).forEach(function (k) {
    if (k === 'accion' || k === 'evento') return;
    s += k + ': ' + (d[k] === '' || d[k] == null ? '—' : d[k]) + '\n';
  });
  if (!paraOrganizacion) s += '\n¡Gracias por inscribirte! Te esperamos para esta nueva aventura.\nTeléfonos: ' + TELEFONOS.join(' · ') + '\nGrupo de la comunidad Open Water en WhatsApp: ' + WHATSAPP_COMUNIDAD + '\n\nOpen Water Río Negro';
  return s;
}

function avisar(d, ev) {
  const nombre = d['Nombre y apellido'] || 'nuevo inscripto';
  MailApp.sendEmail({
    to: DESTINO, subject: EVENTOS[ev].nombre + ' · inscripción de ' + nombre,
    body: textoMail(d, ev, true), htmlBody: htmlMail(d, ev, true), name: 'Open Water Río Negro'
  });
  if (d['Email']) {
    MailApp.sendEmail({
      to: d['Email'], subject: 'Inscripción recibida · ' + EVENTOS[ev].nombre,
      body: textoMail(d, ev, false), htmlBody: htmlMail(d, ev, false),
      name: 'Open Water Río Negro', replyTo: DESTINO
    });
  }
}

/** Prueba: ejecutar a mano desde el editor para recibir un mail de ejemplo en DESTINO. */
function probarMail() {
  const d = {'evento': 'combo', 'Nombre y apellido': 'Nadador de Prueba', 'Email': DESTINO, 'DNI': '12345678', 'Plan de pago': 'Contado', 'Estado de pago': 'Pagado', 'Monto': '$340.000', 'Contacto de emergencia': 'Familiar de prueba', 'Teléfono de emergencia': '2920 000000'};
  avisar(d, 'combo');
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}


/* Correr UNA VEZ desde el editor (después de pegar esta versión): agrega la columna
   "Cupón" al final de las hojas Summer y Eclipse ya existentes. Las fichas con cupón
   escriben ahí el código usado (queda un registro por nadador). */
function agregarColumnaCupon() {
  ['summer', 'eclipse'].forEach(function (ev) {
    const h = hoja(ev, HOJAS[ev].destino);
    if (h.getLastRow() === 0) return;
    const cab = h.getRange(1, 1, 1, h.getLastColumn()).getValues()[0].map(norm);
    if (cab.indexOf(norm('Cupón')) !== -1) return;
    const c = h.getLastColumn() + 1;
    h.getRange(1, c).setValue('Cupón').setFontWeight('bold');
  });
}
