/**
 * RECORDATORIO AUTOMÁTICO DE CUOTAS — Open Water Río Negro
 * Asociación Civil y Deportiva Open Water · CUIT 33-71941685-9
 *
 * Qué hace: una vez por día revisa la planilla de socios y le manda un email
 * a cada socio cuyo último pago tenga 30 días o más. Registra la fecha del
 * aviso para no repetirlo antes de 7 días.
 *
 * CÓMO INSTALARLO (una sola vez, ~10 minutos)
 * 1. Abrí la planilla de socios en Google Sheets.
 * 2. Extensiones → Apps Script. Borrá lo que haya y pegá este archivo completo.
 * 3. Revisá los nombres de las columnas en CONFIG.columnas: tienen que coincidir
 *    con los encabezados de la fila 1 de tu planilla (son los mismos que exporta
 *    la página "Socios activos": Nombre y apellido, Email, Modalidad, Cuota
 *    mensual, Último pago, Pago del mes).
 * 4. Guardá y ejecutá una vez la función revisarCuotas: Google va a pedirte
 *    permiso para enviar correos en tu nombre. Aceptá.
 * 5. En el panel izquierdo: Activadores (el reloj) → Añadir activador
 *    → función revisarCuotas → basado en tiempo → temporizador diario
 *    → 8:00-9:00. Guardar. Listo: corre solo todos los días.
 *
 * Para probar sin enviar nada: poné CONFIG.simulacro = true y mirá el registro
 * de ejecución (se ve a quién le habría escrito).
 */

const CONFIG = {
  hoja: 'Socios',              // nombre de la pestaña de la planilla
  diasCiclo: 30,               // a los cuántos días del último pago se recuerda
  diasEntreAvisos: 7,          // no repetir el aviso antes de estos días
  copiaOculta: '',             // ej. 'openwaterrionegro@gmail.com' para recibir copia
  simulacro: false,            // true = no envía, solo registra
  columnas: {
    nombre:      'Nombre y apellido',
    email:       'Email',
    modalidad:   'Modalidad',
    cuota:       'Cuota mensual',
    ultimoPago:  'Último pago',
    estadoPago:  'Pago del mes',
    ultimoAviso: 'Último aviso'   // se crea sola si no existe
  }
};

const DATOS_BANCARIOS =
  'Asociación Civil y Deportiva Open Water · CUIT 33-71941685-9\n' +
  'Banco Patagonia · CA $ 299-299040170-000\n' +
  'CBU 0340299508299040170004\n' +
  'Alias OWRIONEGRO';

function revisarCuotas() {
  const hoja = SpreadsheetApp.getActive().getSheetByName(CONFIG.hoja) || SpreadsheetApp.getActive().getSheets()[0];
  const rango = hoja.getDataRange().getValues();
  if (rango.length < 2) return;

  const cab = rango[0].map(String);
  const col = {};
  Object.keys(CONFIG.columnas).forEach(k => col[k] = cab.indexOf(CONFIG.columnas[k]));

  // crea la columna "Último aviso" si falta
  if (col.ultimoAviso === -1) {
    hoja.getRange(1, cab.length + 1).setValue(CONFIG.columnas.ultimoAviso);
    col.ultimoAviso = cab.length;
  }

  const hoy = new Date();
  let enviados = 0, revisados = 0;

  for (let i = 1; i < rango.length; i++) {
    const fila = rango[i];
    const email = String(fila[col.email] || '').trim();
    const nombre = String(fila[col.nombre] || '').trim();
    if (!email || !nombre) continue;
    revisados++;

    const dias = diasDesde(fila[col.ultimoPago], hoy);
    const vencida = dias === null || dias >= CONFIG.diasCiclo;
    if (!vencida) continue;

    const diasAviso = diasDesde(fila[col.ultimoAviso], hoy);
    if (diasAviso !== null && diasAviso < CONFIG.diasEntreAvisos) continue;

    const cuerpo = mensaje(nombre, fila[col.modalidad], fila[col.cuota], fila[col.ultimoPago], dias);

    if (CONFIG.simulacro) {
      Logger.log('SIMULACRO → ' + email + ' (' + (dias === null ? 'sin pago registrado' : dias + ' días') + ')');
    } else {
      const opciones = {name: 'Open Water Río Negro'};
      if (CONFIG.copiaOculta) opciones.bcc = CONFIG.copiaOculta;
      MailApp.sendEmail(email, 'Cuota de socio · Open Water Río Negro', cuerpo, opciones);
      hoja.getRange(i + 1, col.ultimoAviso + 1).setValue(hoy);
    }
    enviados++;
  }
  Logger.log('Socios revisados: ' + revisados + ' · recordatorios: ' + enviados + (CONFIG.simulacro ? ' (simulacro)' : ''));
}

function diasDesde(valor, hoy) {
  if (!valor) return null;
  const f = valor instanceof Date ? valor : new Date(String(valor).split('/').reverse().join('-'));
  if (isNaN(f.getTime())) return null;
  return Math.floor((hoy - f) / 86400000);
}

function mensaje(nombre, modalidad, cuota, ultimoPago, dias) {
  const pila = String(nombre).split(' ')[0];
  const detalle = dias === null
    ? 'No tenemos registrado tu último pago.'
    : 'Tu último pago registrado es del ' + formatear(ultimoPago) + ', hace ' + dias + ' días.';
  return 'Hola ' + pila + ', ¿cómo estás?\n\n' +
    'Te escribimos de la Asociación Civil y Deportiva Open Water para recordarte la cuota de ' +
    (modalidad || 'socio') + (cuota ? ' (' + cuota + ' por mes)' : '') + '.\n' +
    detalle + '\n\n' +
    'Si ya abonaste, respondé este correo con el comprobante así lo registramos y no te llegan más avisos.\n\n' +
    'Datos para transferir:\n' + DATOS_BANCARIOS + '\n\n' +
    '¡Gracias por ser parte y nos vemos en el agua!\n' +
    'Open Water Río Negro · openwaterrionegro@gmail.com · openwater.ar';
}

function formatear(v) {
  const f = v instanceof Date ? v : new Date(String(v));
  return isNaN(f.getTime()) ? String(v) : Utilities.formatDate(f, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy');
}
