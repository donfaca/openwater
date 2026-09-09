/**
 * INSCRIPCIONES OPEN WATER 2027 · SUMMER + ECLIPSE + COMBO
 * Un solo Apps Script para las tres fichas web:
 *   ficha-summer-2027.html   → evento: 'summer'
 *   ficha-eclipse-2027.html  → evento: 'eclipse'
 *   ficha-combo-2027.html    → evento: 'combo'
 *
 * QUÉ HACE
 *   {accion:'crear', evento}  → crea el pago en Mercado Pago y devuelve el link del QR
 *   {accion:'estado', ref}    → consulta si ese pago ya fue acreditado
 *   {accion:'ficha', evento}  → guarda la inscripción en la planilla que corresponde:
 *        summer  → hoja de inscripciones de Summer
 *        eclipse → hoja de inscripciones de Eclipse
 *        combo   → hoja del Combo  +  hoja de Summer  +  hoja de Eclipse
 *                  (quien se anota al combo queda inscripto en las dos
 *                   competencias automáticamente, con Origen = "Combo")
 *   sincronizarCombo()        → recorre TODAS las hojas de Summer y de Eclipse
 *        (incluidas las respuestas de los Google Forms viejos) y suma a la hoja
 *        del Combo a quien aparece en las dos competencias. Se puede correr a
 *        mano o con un activador diario. Es idempotente: no duplica DNI.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * INSTALACIÓN (una sola vez)
 * 1. https://script.google.com → Nuevo proyecto. Borrá todo y pegá este archivo.
 * 2. Completá ACCESS_TOKEN (ver PAGOS-MERCADOPAGO.md). Los IDs de las TRES
 *    planillas oficiales (cada una en su propio archivo) ya están cargados en
 *    PLANILLAS: summer, eclipse y combo, cada una con una única pestaña con
 *    ese mismo nombre ("Summer", "Eclipse", "Combo"). Las pestañas "Pagos ..."
 *    se crean solas la primera vez que alguien genera un pago.
 *    La cuenta que ejecuta el script tiene que poder EDITAR las tres planillas.
 * 3. Guardar → Implementar → Nueva implementación → "Aplicación web":
 *      Ejecutar como: yo · Quién tiene acceso: cualquier persona
 *    Copiá la URL /exec y pegala en la constante ENDPOINT de las TRES fichas
 *    (raíz y sitio-openwater/): summer, eclipse y combo usan la misma URL.
 * 4. Para la sincronización automática: Activadores → Agregar activador →
 *    función sincronizarCombo · basado en tiempo · cada día.
 * 5. Prueba: PRUEBA = true → los QR salen $10.
 *
 * NOTA SOBRE LAS HOJAS
 *   Este script NO necesita que las columnas estén en un orden determinado:
 *   busca cada dato por el encabezado (sin importar mayúsculas, acentos ni el
 *   texto largo de las preguntas del Google Form). Si una columna no existe en
 *   la hoja destino, la crea al final. Así puede escribir tanto en las hojas
 *   nuevas como en las respuestas de los formularios viejos.
 */

const ACCESS_TOKEN = 'PEGAR-AQUI-EL-ACCESS-TOKEN-DE-MERCADO-PAGO';
const DESTINO = 'openwaterrionegro@gmail.com';
const PRUEBA = false;   // true = todos los pagos cuestan $10, para probar

const PLANILLAS = {
  summer:  '18u_DigYqYoMp0vNZF96zJJyL254n-bL1MraNeXS-2sg',   // planilla oficial Summer
  eclipse: '1jHhL0-7iVixI4w3fWFM4kJeS0R2bwoWfOjIt2n_E8SM',   // planilla oficial Eclipse
  combo:   '1_M-P5Rw3-zOYZA1pdDHbzH_b42iEGR-O-c_NJI0oF0M'    // planilla oficial Combo (archivo propio)
};

/* Pestañas de cada competencia.
   destino  = dónde escriben las fichas web (se crea si no existe)
   lectura  = todas las hojas donde puede figurar un inscripto, incluidas las
              respuestas del Google Form viejo. Se usan para sincronizarCombo(). */
const HOJAS = {
  summer:  {destino: 'Summer',  lectura: ['Summer'],  pagos: 'Pagos Summer'},
  eclipse: {destino: 'Eclipse', lectura: ['Eclipse'], pagos: 'Pagos Eclipse'},
  combo:   {destino: 'Combo',   lectura: ['Combo'],   pagos: 'Pagos Combo'}
};

const EVENTOS = {
  summer:  {nombre: '2ª Summer Open Water 2027', prefijo: 'SOW27',   volver: 'https://openwater.ar/summer-open-water-2027.html'},
  eclipse: {nombre: 'OWeclipse 2027 · 2.5K',     prefijo: 'OWE27',   volver: 'https://openwater.ar/oweclipse-2027.html'},
  combo:   {nombre: 'Combo Summer + Eclipse 2027', prefijo: 'COMBO27', volver: 'https://openwater.ar/index.html'}
};

/* Diccionario de columnas: para cada dato, los encabezados que valen como
   equivalentes. Se compara normalizado (sin acentos, minúsculas) y alcanza con
   que el encabezado de la hoja CONTENGA alguno de estos textos. */
const COLUMNAS = {
  'Fecha de envío':            ['fecha de envio', 'marca temporal', 'timestamp'],
  'Nombre y apellido':         ['apellido y nombre', 'nombre y apellido', 'nombre completo'],
  'DNI':                       ['dni', 'documento', 'pasaporte'],
  'CUIL':                      ['cuil', 'cuit'],
  'Fecha de nacimiento':       ['fecha de nacimiento', 'nacimiento'],
  'Nacionalidad':              ['nacionalidad'],
  'Ciudad':                    ['tu ciudad', 'ciudad', 'localidad'],
  'Club o equipo':             ['club', 'equipo'],
  'Email':                     ['email', 'correo', 'mail'],
  'Teléfono':                  ['telefono', 'whatsapp', 'celular'],
  'Categoría':                 ['categoria por genero', 'categoria de premiacion', 'categoria'],
  'Género':                    ['genero para la premiacion', 'genero', 'sexo'],
  'Categoría de edad':         ['categoria de edad'],
  'Prueba':                    ['nadare en las siguientes pruebas', 'prueba', 'distancia', 'modalidad'],
  'Talle':                     ['talle'],
  'Experiencia':               ['experiencia'],
  'Mejor marca':               ['mejor marca'],
  'Apto médico':               ['apto medico', 'certificado medico'],
  'Obra social':               ['obra social', 'prepaga'],
  'Grupo sanguíneo':           ['grupo sanguineo'],
  'Contacto de emergencia':    ['contacto de emergencia'],
  'Teléfono de emergencia':    ['telefono de emergencia'],
  'Observaciones médicas':     ['observaciones medicas', 'alergias', 'medicacion'],
  'Acepta reglamento':         ['aceptacion del reglamento', 'acepta reglamento', 'reglamento'],
  'Plan de pago':              ['plan de pago', 'plan'],
  'Monto':                     ['monto'],
  'Forma de pago':             ['forma de pago'],
  'Estado de pago':            ['estado de pago'],
  'Referencia de pago':        ['referencia de pago', 'comprobante', 'numero de operacion'],
  'Origen':                    ['origen']
};

/* ---------- Router ---------- */

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const ev = EVENTOS[d.evento] ? d.evento : 'eclipse';
    if (d.accion === 'crear')  return respuesta(crearPago(d, ev));
    if (d.accion === 'estado') return respuesta(estadoPago(d.ref, d.evento));
    if (d.accion === 'ficha')  { guardarFicha(d, ev); avisar(d, ev); return respuesta({ok: true}); }
    return respuesta({ok: false, error: 'acción desconocida'});
  } catch (err) {
    return respuesta({ok: false, error: String(err)});
  }
}

function doGet() {
  return respuesta({ok: true, mensaje: 'Endpoint de inscripciones OW 2027 activo (summer · eclipse · combo).'});
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

/* ---------- Acceso a las hojas ---------- */

function hoja(evento, nombre) {
  const ss = SpreadsheetApp.openById(PLANILLAS[evento]);
  return ss.getSheetByName(nombre) || ss.insertSheet(nombre);
}

function hojaSiExiste(evento, nombre) {
  return SpreadsheetApp.openById(PLANILLAS[evento]).getSheetByName(nombre);
}

function norm(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

/* Índice (0-based) de la columna que corresponde al dato "clave", o -1 */
function buscarColumna(cabNorm, clave) {
  const alias = COLUMNAS[clave] || [norm(clave)];
  for (let i = 0; i < cabNorm.length; i++) {
    for (let a = 0; a < alias.length; a++) {
      if (cabNorm[i] && cabNorm[i].indexOf(alias[a]) !== -1) return i;
    }
  }
  return -1;
}

/**
 * Agrega una fila en la hoja ubicando cada dato por encabezado.
 * Si la hoja está vacía, escribe los encabezados en el orden de `datos`.
 * Si falta una columna, la crea al final. Nunca reordena lo que ya existe.
 */
function escribir(h, datos) {
  const claves = Object.keys(datos);
  if (h.getLastRow() === 0) {
    h.appendRow(claves);
    h.setFrozenRows(1);
    h.getRange(1, 1, 1, claves.length).setFontWeight('bold');
  }
  let cab = h.getRange(1, 1, 1, Math.max(h.getLastColumn(), 1)).getValues()[0];
  let cabNorm = cab.map(norm);
  const fila = new Array(cab.length).fill('');
  claves.forEach(function (k) {
    let i = buscarColumna(cabNorm, k);
    if (i === -1) {
      h.getRange(1, cab.length + 1).setValue(k).setFontWeight('bold');
      cab.push(k); cabNorm.push(norm(k)); fila.push('');
      i = cab.length - 1;
    }
    fila[i] = datos[k];
  });
  h.appendRow(fila);
}

/* ---------- Guardado de fichas ---------- */

function base(d) {
  return {
    'Fecha de envío': d['Fecha de envío'] || new Date().toLocaleString('es-AR'),
    'Nombre y apellido': d['Nombre y apellido'] || '',
    'DNI': d['DNI'] || '',
    'CUIL': d['CUIL'] || '',
    'Fecha de nacimiento': d['Fecha de nacimiento'] || '',
    'Nacionalidad': d['Nacionalidad'] || '',
    'Ciudad': d['Ciudad'] || '',
    'Club o equipo': d['Club o equipo'] || '',
    'Email': d['Email'] || '',
    'Teléfono': d['Teléfono'] || '',
    'Experiencia': d['Experiencia'] || '',
    'Mejor marca': d['Mejor marca'] || '',
    'Apto médico': d['Apto médico'] || '',
    'Obra social': d['Obra social'] || '',
    'Grupo sanguíneo': d['Grupo sanguíneo'] || '',
    'Contacto de emergencia': d['Contacto de emergencia'] || '',
    'Teléfono de emergencia': d['Teléfono de emergencia'] || '',
    'Observaciones médicas': d['Observaciones médicas'] || '',
    'Plan de pago': d['Plan de pago'] || '',
    'Monto': d['Monto'] || '',
    'Forma de pago': d['Forma de pago'] || '',
    'Estado de pago': d['Estado de pago'] || '',
    'Referencia de pago': d['Referencia de pago'] || d['Número de operación'] || '',
    'Uso de imagen': d['Uso de imagen'] || '',
    'Aptitud física': d['Aptitud física'] || '',
    'No reembolsable': d['No reembolsable'] || ''
  };
}

function filaSummer(d, origen) {
  const f = base(d);
  f['Competencia'] = EVENTOS.summer.nombre;
  f['Prueba'] = origen ? 'Campeonato 5K + 10K + 2K Travel Night Fest · Combo' : (d['Prueba'] || '');
  f['Talle'] = d['Talle poncho Summer'] || d['Talle'] || '';
  f['Género'] = d['Género'] || '';
  f['Categoría de edad'] = d['Categoría de edad'] || '';
  f['Acepta reglamento'] = d['Acepta reglamento Summer'] || d['Acepta reglamento'] || '';
  f['Dispositivo de seguridad'] = d['Dispositivo de seguridad'] || '';
  f['Nada sin kit'] = d['Nada sin kit'] || 'No';
  if (origen) { f['Monto'] = 'Incluido en el combo (' + (d['Total del combo'] || d['Monto'] || '') + ')'; f['Origen'] = origen; }
  return f;
}

function filaEclipse(d, origen) {
  const f = base(d);
  f['Competencia'] = EVENTOS.eclipse.nombre;
  f['Prueba'] = origen ? '2.500 m · Combo' : (d['Prueba'] || '2.500 m');
  f['Talle'] = d['Talle remera Eclipse'] || d['Talle'] || '';
  f['Categoría'] = d['Categoría Eclipse'] || d['Categoría'] || '';
  f['Acepta reglamento'] = d['Acepta reglamento Eclipse'] || d['Acepta reglamento'] || '';
  f['Riesgo solar'] = d['Riesgo solar'] || '';
  if (origen) { f['Monto'] = 'Incluido en el combo (' + (d['Total del combo'] || d['Monto'] || '') + ')'; f['Origen'] = origen; }
  return f;
}

function filaCombo(d, origen) {
  const f = base(d);
  f['Competencia'] = EVENTOS.combo.nombre;
  f['Pruebas'] = d['Pruebas'] || '5K + 10K + 2K Travel Night Fest (Summer) + 2.500 m (OWeclipse)';
  f['Género'] = d['Género'] || '';
  f['Categoría de edad'] = d['Categoría de edad'] || '';
  f['Categoría Eclipse'] = d['Categoría Eclipse'] || '';
  f['Talle poncho Summer'] = d['Talle poncho Summer'] || '';
  f['Talle remera Eclipse'] = d['Talle remera Eclipse'] || '';
  f['Período de precio'] = d['Período de precio'] || '';
  f['Total del combo'] = d['Total del combo'] || '';
  f['Grupo'] = d['Grupo'] || '';
  f['Responsable del grupo'] = d['Responsable del grupo'] || '';
  f['Acepta reglamento Summer'] = d['Acepta reglamento Summer'] || '';
  f['Acepta reglamento Eclipse'] = d['Acepta reglamento Eclipse'] || '';
  f['Dispositivo de seguridad'] = d['Dispositivo de seguridad'] || '';
  f['Riesgo solar'] = d['Riesgo solar'] || '';
  f['Origen'] = origen || 'Ficha del combo';
  return f;
}

function guardarFicha(d, ev) {
  if (ev === 'summer')  { escribir(hoja('summer',  HOJAS.summer.destino),  filaSummer(d, '')); return; }
  if (ev === 'eclipse') { escribir(hoja('eclipse', HOJAS.eclipse.destino), filaEclipse(d, '')); return; }
  /* combo: las tres hojas */
  escribir(hoja('combo',   HOJAS.combo.destino),   filaCombo(d, 'Ficha del combo'));
  escribir(hoja('summer',  HOJAS.summer.destino),  filaSummer(d, 'Combo Summer + Eclipse'));
  escribir(hoja('eclipse', HOJAS.eclipse.destino), filaEclipse(d, 'Combo Summer + Eclipse'));
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
 * Junta los inscriptos de Summer y de Eclipse (hojas nuevas + respuestas de los
 * Google Forms) y agrega a la hoja del Combo a quien esté en las dos.
 * Corrida a mano o con activador diario. No duplica: compara por DNI.
 */

function leerInscriptos(evento) {
  const out = {};
  if (String(PLANILLAS[evento]).indexOf('PEGAR') === 0) return out;
  HOJAS[evento].lectura.forEach(function (nombre) {
    const h = hojaSiExiste(evento, nombre);
    if (!h || h.getLastRow() < 2) return;
    const v = h.getDataRange().getValues();
    const cabNorm = v[0].map(norm);
    const iDni = buscarColumna(cabNorm, 'DNI');
    const iNom = buscarColumna(cabNorm, 'Nombre y apellido');
    const iMail = buscarColumna(cabNorm, 'Email');
    const iTel = buscarColumna(cabNorm, 'Teléfono');
    const iCiu = buscarColumna(cabNorm, 'Ciudad');
    const iClub = buscarColumna(cabNorm, 'Club o equipo');
    const iCat = buscarColumna(cabNorm, 'Categoría');
    const iNac = buscarColumna(cabNorm, 'Fecha de nacimiento');
    const iCuil = buscarColumna(cabNorm, 'CUIL');
    for (let r = 1; r < v.length; r++) {
      const dni = iDni === -1 ? '' : String(v[r][iDni]).replace(/\D/g, '');
      const nom = iNom === -1 ? '' : String(v[r][iNom]).trim();
      if (!dni && !nom) continue;
      const clave = dni || norm(nom);
      out[clave] = {
        clave: clave,
        dni: dni,
        nombre: nom,
        email: iMail === -1 ? '' : v[r][iMail],
        telefono: iTel === -1 ? '' : v[r][iTel],
        ciudad: iCiu === -1 ? '' : v[r][iCiu],
        club: iClub === -1 ? '' : v[r][iClub],
        categoria: iCat === -1 ? '' : v[r][iCat],
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

  /* claves ya cargadas en la hoja del combo */
  const ya = {};
  if (hc.getLastRow() > 1) {
    const v = hc.getDataRange().getValues();
    const cabNorm = v[0].map(norm);
    const iDni = buscarColumna(cabNorm, 'DNI');
    const iNom = buscarColumna(cabNorm, 'Nombre y apellido');
    for (let r = 1; r < v.length; r++) {
      const dni = iDni === -1 ? '' : String(v[r][iDni]).replace(/\D/g, '');
      const nom = iNom === -1 ? '' : String(v[r][iNom]).trim();
      if (dni) ya[dni] = true;
      if (nom) ya[norm(nom)] = true;
    }
  }

  /* solo entra quien está inscripto en las DOS planillas individuales. */
  const sumados = [];
  Object.keys(s).forEach(function (k) {
    if (ya[k] || !e[k]) return;
    const p = e[k], q = s[k];
    escribir(hc, {
      'Fecha de envío': new Date().toLocaleString('es-AR'),
      'Nombre y apellido': p.nombre || q.nombre || '',
      'DNI': p.dni || q.dni || '',
      'Fecha de nacimiento': p.nacimiento || q.nacimiento || '',
      'CUIL': p.cuil || q.cuil || '',
      'Ciudad': p.ciudad || q.ciudad || '',
      'Club o equipo': p.club || q.club || '',
      'Email': p.email || q.email || '',
      'Teléfono': p.telefono || q.telefono || '',
      'Competencia': EVENTOS.combo.nombre,
      'Pruebas': '5K + 10K + 2K Travel Night Fest (Summer) + 2.500 m (OWeclipse)',
      'Categoría Eclipse': p.categoria || '',
      'Estado de pago': 'A verificar en cada competencia',
      'Origen': 'Detectado en ambas planillas (' + q.hoja + ' + ' + p.hoja + ')'
    });
    ya[k] = true;
    sumados.push((p.nombre || q.nombre || k) + ' · en ambas planillas');
  });

  if (sumados.length) {
    MailApp.sendEmail(DESTINO, 'Combo 2027 · ' + sumados.length + ' nadador(es) sumados a la hoja del combo',
      'La sincronización agregó a la hoja "' + HOJAS.combo.destino + '":\n\n· ' + sumados.join('\n· ') +
      '\n\nRevisá el estado de pago de cada uno: el combo tiene su propio valor.\n');
  }
  return sumados;
}

/* ---------- Emails ---------- */

function avisar(d, ev) {
  const nombre = d['Nombre y apellido'] || 'nuevo inscripto';
  const esCombo = ev === 'combo';
  let cuerpo =
    'Nueva inscripción · ' + EVENTOS[ev].nombre + '\n' +
    (esCombo ? '(queda cargada también en las hojas de Summer y de Eclipse)\n' : '') + '\n' +
    'Nadador: ' + nombre + '\n' +
    'DNI: ' + (d['DNI'] || '') + ' · CUIL: ' + (d['CUIL'] || '') + '\n' +
    'Nacimiento: ' + (d['Fecha de nacimiento'] || '') + '\n' +
    'Ciudad: ' + (d['Ciudad'] || '') + ' · Club: ' + (d['Club o equipo'] || '-') + '\n' +
    'Email: ' + (d['Email'] || '') + ' · WhatsApp: ' + (d['Teléfono'] || '') + '\n';
  if (esCombo) {
    cuerpo += 'Summer: ' + (d['Género'] || '') + ' ' + (d['Categoría de edad'] || '') + ' · poncho ' + (d['Talle poncho Summer'] || '') + '\n' +
              'Eclipse: ' + (d['Categoría Eclipse'] || '') + ' · remera ' + (d['Talle remera Eclipse'] || '') + '\n' +
              'Total del combo: ' + (d['Total del combo'] || '') + '\n' +
              (d['Grupo'] ? 'Grupo: ' + d['Grupo'] + ' (' + (d['Responsable del grupo'] || '') + ')\n' : '');
  } else {
    cuerpo += 'Prueba: ' + (d['Prueba'] || '') + '\n' +
              'Categoría: ' + (d['Categoría'] || (d['Género'] || '') + ' ' + (d['Categoría de edad'] || '')) + '\n' +
              'Talle: ' + (d['Talle'] || '') + '\n';
  }
  cuerpo += 'Plan: ' + (d['Plan de pago'] || '') + ' · cobrado ahora ' + (d['Monto'] || '') + '\n' +
            'Forma de pago: ' + (d['Forma de pago'] || '') + ' · estado: ' + (d['Estado de pago'] || '') + '\n' +
            'Referencia: ' + (d['Referencia de pago'] || d['Número de operación'] || '') + '\n' +
            'Apto médico: ' + (d['Apto médico'] || 'sin cargar') + '\n' +
            'Emergencia: ' + (d['Contacto de emergencia'] || '') + ' · ' + (d['Teléfono de emergencia'] || '') + '\n';
  MailApp.sendEmail(DESTINO, EVENTOS[ev].nombre + ' · inscripción de ' + nombre, cuerpo);

  if (d['Email']) {
    const texto = esCombo
      ? 'Recibimos tu inscripción al Combo Summer + Eclipse 2027. Con esta ficha quedás anotado en las dos competencias:\n' +
        '· 2ª Summer Open Water: 5K (sábado 23 de enero), 10K (domingo 24) y 2K Travel Night Fest, en Patagones – Viedma.\n' +
        '· OWeclipse: 2.500 m el sábado 6 de febrero en Las Grutas, largada 10:31:40 hs.\n' +
        'No hace falta completar los formularios individuales.\n'
      : 'Recibimos tu inscripción a ' + EVENTOS[ev].nombre + '.\n';
    MailApp.sendEmail(d['Email'], 'Inscripción recibida · ' + EVENTOS[ev].nombre,
      'Hola ' + nombre + ',\n\n' + texto + '\n' +
      'Plan de pago: ' + (d['Plan de pago'] || '') + '.\n' +
      'Estado del pago: ' + (d['Estado de pago'] || '') + '.\n\n' +
      'Recordá presentar el apto médico vigente en la acreditación' +
      (esCombo || ev === 'eclipse' ? ' (para OWeclipse, con máximo 3 meses de antigüedad a la fecha de la competencia)' : '') + '.\n\n' +
      'Open Water Río Negro');
  }
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
