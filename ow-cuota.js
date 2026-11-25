/* Pago de cuota · Entrená en OW (pileta + río)
   Se monta solo en <div id="ow-cuota"></div>. Necesita ow-qrcode.js.
   Habla con el mismo Apps Script de las inscripciones (acciones crearCuota / estado),
   que crea el cobro en la cuenta de Mercado Pago y confirma cuando se acredita. */
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxIaZeJVEvJ5pVyrxjSVmxo0oH5Be25zwl6ysPXzY9eNGm8g-TA8unT7LqdKIZWJJsKlg/exec';
  /* Valores de la cuota mensual (solo para mostrar: el cobro real lo fija el Apps Script) */
  var PRECIO = {SI: {pileta: 80000, rio: 60000}, NO: {pileta: 100000, rio: 70000}};
  var MODS = {pileta: 'Pileta + aguas abiertas', rio: 'Solo aguas abiertas'};
  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var LS = 'ow-cuota-pendiente';

  function plata(n) { return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }

  function qrSvg(texto, px) {
    var q = qrcode(0, 'M'); q.addData(texto); q.make();
    var n = q.getModuleCount(), m = 3, tot = n + 2 * m, d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px + '" viewBox="0 0 ' + tot + ' ' + tot + '" shape-rendering="crispEdges"><rect width="' + tot + '" height="' + tot + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }

  /* en el diseño (.dc.html) y en el sitio publicado (.html, y su versión móvil) el nombre de la página cambia */
  function hrefSocios() { return '#asociate'; }   /* la ficha de socio está más abajo, en la misma página (Nada con OW) */

  function opcionesMes() {
    var hoy = new Date(), out = [];
    for (var i = -1; i <= 2; i++) {
      var f = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
      var t = MESES[f.getMonth()] + ' ' + f.getFullYear();
      out.push('<option value="' + t + '"' + (i === 0 ? ' selected' : '') + '>' + t + '</option>');
    }
    return out.join('');
  }

  var CSS = '' +
    '.owc{max-width:760px;margin:0 auto;padding:26px 28px 28px;border-radius:18px;background:linear-gradient(135deg,#1BCCCE 0%,#10B3BD 55%,#0a95a6 100%);color:#04212e;box-shadow:0 18px 44px rgba(0,0,0,.35);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;text-align:left;box-sizing:border-box}' +
    '.owc *{box-sizing:border-box}' +
    '.owc-k{font-family:"Bebas Neue",sans-serif;letter-spacing:4px;font-size:14px;color:#04384a;opacity:.85}' +
    '.owc h3{font-family:"Bebas Neue",sans-serif;font-weight:400;font-size:36px;line-height:1;margin:2px 0 6px;color:#04212e}' +
    '.owc-s{font-size:14.5px;line-height:1.55;margin:0 0 18px;color:#06394b}' +
    '.owc-g{display:grid;grid-template-columns:1fr 1fr;gap:14px 16px}' +
    '.owc-f{display:flex;flex-direction:column;gap:6px;font-weight:800;font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:#04384a}' +
    '.owc-f.full{grid-column:1/-1}' +
    '.owc input[type=text],.owc select{width:100%;padding:12px 13px;border-radius:10px;border:2px solid rgba(4,33,46,.25);background:#fff;color:#04212e;font-size:16px;font-family:inherit;font-weight:600;text-transform:none;letter-spacing:0}' +
    '.owc input[type=text]:focus,.owc select:focus{outline:none;border-color:#04212e}' +
    '.owc-op{display:flex;gap:10px;flex-wrap:wrap}' +
    '.owc-op label{flex:1 1 150px;cursor:pointer;margin:0}' +
    '.owc-op input{position:absolute;opacity:0;pointer-events:none}' +
    '.owc-op span{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 8px;border-radius:12px;background:rgba(255,255,255,.55);border:2px solid transparent;text-transform:none;letter-spacing:0;font-weight:700;color:#04212e;text-align:center;line-height:1.15}' +
    '.owc-op span b{font-family:"Bebas Neue",sans-serif;font-weight:400;font-size:28px;letter-spacing:1px}' +
    '.owc-op input:checked+span{background:#04212e;color:#fff;border-color:#04212e}' +
    '.owc-op input:focus-visible+span{outline:3px solid #fff;outline-offset:2px}' +
    '.owc-planes{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    '.owc-planes label{cursor:pointer;margin:0;display:block}' +
    '.owc-planes input{position:absolute;opacity:0;pointer-events:none}' +
    '.owc-planes span{display:flex;flex-direction:column;align-items:flex-start;height:100%;padding:11px 14px;border-radius:12px;background:rgba(255,255,255,.55);border:2px solid transparent;text-transform:none;letter-spacing:0;color:#04212e;line-height:1.2;transition:background .15s,border-color .15s}' +
    '.owc-planes em{font-style:normal;font-family:"Bebas Neue",sans-serif;font-size:15px;letter-spacing:3px;color:#04384a}' +
    '.owc-planes strong{font-size:15px;font-weight:800}' +
    '.owc-planes b{font-family:"Bebas Neue",sans-serif;font-weight:400;font-size:38px;line-height:1.05;letter-spacing:1px}' +
    '.owc-planes small{font-size:12.5px;font-weight:600;color:#06394b}' +
    '.owc-planes label:hover span{border-color:#04212e}' +
    '.owc-planes input:checked+span{background:#04212e;color:#fff;border-color:#04212e}' +
    '.owc-planes input:checked+span em,.owc-planes input:checked+span small{color:#8fd4f5}' +
    '.owc-planes input:focus-visible+span{outline:3px solid #fff;outline-offset:2px}' +
    '.owc-precio{display:flex;align-items:center;min-height:50px;padding:6px 14px;border-radius:12px;background:rgba(255,255,255,.55);font-family:"Bebas Neue",sans-serif;font-weight:400;font-size:30px;letter-spacing:1px;text-transform:none;color:#04212e}' +
    '.owc-precio small{font-family:system-ui,sans-serif;font-size:13px;font-weight:700;letter-spacing:0;margin-left:8px}' +
    '.owc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:18px;padding:15px 20px;border:0;border-radius:999px;background:#04212e;color:#fff;font-family:"Bebas Neue",sans-serif;font-size:26px;letter-spacing:2px;cursor:pointer;text-decoration:none;transition:transform .15s,opacity .15s}' +
    '.owc-btn:hover:not(:disabled){transform:translateY(-2px)}' +
    '.owc-btn:disabled{opacity:.45;cursor:not-allowed}' +
    '.owc-btn.sec{background:rgba(255,255,255,.55);color:#04212e;font-size:20px;padding:11px 18px;margin-top:10px}' +
    '.owc-btn.ok{background:#0f7a3a;opacity:1;animation:owcpop .5s ease}' +
    '@keyframes owcpop{0%{transform:scale(.94)}60%{transform:scale(1.04)}100%{transform:scale(1)}}' +
    '.owc-err{margin-top:12px;padding:10px 14px;border-radius:10px;background:#fff;color:#8a1c10;font-weight:700;font-size:14px;border:2px solid #d43b25}' +
    '.owc-pago{margin-top:20px;display:flex;gap:22px;flex-wrap:wrap;align-items:center;padding:18px;border-radius:14px;background:rgba(255,255,255,.35)}' +
    '.owc-qr{flex:0 0 auto;padding:10px;background:#fff;border-radius:12px;line-height:0;box-shadow:0 6px 18px rgba(0,0,0,.2)}' +
    '.owc-info{flex:1 1 220px;min-width:0}' +
    '.owc-info .t{font-family:"Bebas Neue",sans-serif;font-size:34px;line-height:1;color:#04212e}' +
    '.owc-info .d{font-size:14.5px;line-height:1.55;margin:4px 0 0;color:#06394b}' +
    '.owc-st{display:flex;align-items:center;gap:9px;margin-top:10px;font-weight:800;font-size:14px;color:#04212e}' +
    '.owc-dot{width:12px;height:12px;border-radius:50%;background:#04212e;animation:owcp 1.2s ease-in-out infinite}' +
    '@keyframes owcp{0%,100%{opacity:1}50%{opacity:.2}}' +
    '.owc-hint{display:none;margin-top:10px;padding:9px 13px;border-radius:10px;background:#fff;color:#04212e;font-weight:800;font-size:14px;border:2px solid #04212e}' +
    '.owc-asoc{margin:12px 0 0;text-align:center;font-size:15px;font-weight:700;color:#04212e}' +
    '.owc-asoc a{color:#04212e;text-decoration:underline;font-weight:900}' +
    '.owc-nota{margin:14px 0 0;font-size:12.5px;color:#06394b;line-height:1.5}' +
    '@media (max-width:620px){.owc-planes b{font-size:32px}.owc-planes strong{font-size:13.5px}.owc{padding:20px 16px 22px}.owc-g{grid-template-columns:1fr}.owc h3{font-size:30px}.owc-pago{justify-content:center;text-align:center}.owc-st{justify-content:center}}';

  function montar(host) {
    if (host.getAttribute('data-owc')) return;
    host.setAttribute('data-owc', '1');
    if (!document.getElementById('owc-css')) { var st = document.createElement('style'); st.id = 'owc-css'; st.textContent = CSS; document.head.appendChild(st); }
    host.innerHTML =
      '<div class="owc">' +
      '<div class="owc-k">CUOTA MENSUAL</div>' +
      '<h3>ELEGÍ TU OPCIÓN Y PAGÁ</h3>' +
      '<p class="owc-s">Si ya estás inscripto/a, elegí tu opción y pagá la cuota del mes con Mercado Pago: generás el QR, lo escaneás desde tu celular y el pago queda acreditado acá mismo. Si es tu primera vez, completá la ficha más abajo.</p>' +
      '<div class="owc-g">' +
      '<label class="owc-f full">Nombre y apellido<input type="text" id="owc-nom" autocomplete="name" maxlength="80" placeholder="Como figurás en el equipo"></label>' +
      '<div class="owc-f full">Elegí tu opción (tocá la que corresponda)<div class="owc-planes" id="owc-planes">' +
      '<label><input type="radio" name="owc-plan" value="socio:pileta"><span><em>SOCIO</em><strong>Pileta + aguas abiertas</strong><b>' + plata(PRECIO.SI.pileta) + '</b><small>por mes · Con remera de regalo en la 1ª cuota</small></span></label>' +
      '<label><input type="radio" name="owc-plan" value="socio:rio"><span><em>SOCIO</em><strong>Solo aguas abiertas</strong><b>' + plata(PRECIO.SI.rio) + '</b><small>por mes · Con remera de regalo en la 1ª cuota</small></span></label>' +
      '<label><input type="radio" name="owc-plan" value="nosocio:pileta"><span><em>NO SOCIO</em><strong>Pileta + aguas abiertas</strong><b>' + plata(PRECIO.NO.pileta) + '</b><small>por mes · Sin remera</small></span></label>' +
      '<label><input type="radio" name="owc-plan" value="nosocio:rio"><span><em>NO SOCIO</em><strong>Solo aguas abiertas</strong><b>' + plata(PRECIO.NO.rio) + '</b><small>por mes · Sin remera</small></span></label>' +
      '</div></div>' +
      '<label class="owc-f">Mes pagado<select id="owc-mes">' + opcionesMes() + '</select></label>' +
      '</div>' +
      '<button type="button" class="owc-btn" id="owc-gen">GENERAR QR DE PAGO</button>' +
      '<p class="owc-asoc">¿Todavía no te inscribiste? <a href="' + hrefSocios() + '">Completá la ficha →</a></p>' +
      '<div class="owc-hint" id="owc-hint"></div>' +
      '<div id="owc-out"></div>' +
      '</div>';

    var $ = function (s) { return host.querySelector(s); };
    var nom = $('#owc-nom'), mes = $('#owc-mes'), gen = $('#owc-gen'), out = $('#owc-out'), hint = $('#owc-hint');
    var timer = null, vivo = true, tok = 0;

    function planSel() { var r = host.querySelector('input[name=owc-plan]:checked'); return r ? r.value.split(':') : ['', '']; }
    function socio() { var p = planSel()[0]; return p === 'socio' ? 'SI' : (p === 'nosocio' ? 'NO' : ''); }
    function modal() { return planSel()[1]; }
    function precio() {}
    function faltante() {
      if (nom.value.trim().length < 3) return 'Escribí tu nombre y apellido.';
      if (!socio() || !modal()) return 'Elegí tu opción de cuota (tocá una de las cuatro).';
      return '';
    }
    function listo() { var m = faltante(); hint.textContent = m ? '👆 ' + m : ''; hint.style.display = m ? 'block' : 'none'; if (!m) hint.style.display = 'none'; }
    ['input', 'keyup', 'change', 'blur'].forEach(function (ev) { nom.addEventListener(ev, function () { if (hint.textContent) listo(); }); });
    [].forEach.call(host.querySelectorAll('input[name=owc-plan]'), function (r) { r.addEventListener('change', listo); });

    function post(cuerpo) {
      return fetch(ENDPOINT, {method: 'POST', body: JSON.stringify(cuerpo)}).then(function (r) { return r.json(); });
    }
    function error(msg) { out.innerHTML = '<div class="owc-err">' + esc(msg) + '</div>'; }

    function pantallaPago(p) {
      out.innerHTML =
        '<div class="owc-pago">' +
        '<div class="owc-qr">' + qrSvg(p.link, 190) + '</div>' +
        '<div class="owc-info">' +
        '<div class="t">' + plata(p.monto) + '</div>' +
        '<p class="d"><b>' + esc(p.nombre) + '</b><br>Cuota · ' + (p.socio === 'SI' ? 'socio' : 'no socio') + ' · ' + esc(MODS[p.mod] || '') + '<br>Mes: <b>' + esc(p.mes) + '</b></p>' +
        '<div class="owc-st" id="owc-st"><span class="owc-dot"></span><span>Esperando el pago…</span></div>' +
        '</div></div>' +
        '<a class="owc-btn sec" href="' + esc(p.link) + '" target="_blank" rel="noopener">ABRIR EN MERCADO PAGO (SI ESTÁS EN EL CELULAR)</a>' +
        '<button type="button" class="owc-btn" id="owc-pagado" disabled>ESPERANDO EL PAGO…</button>' +
        '<button type="button" class="owc-btn sec" id="owc-volver">← VOLVER (CAMBIAR DATOS O CANCELAR)</button>' +
        '<p class="owc-nota">Escaneá el QR con la cámara o con la app de Mercado Pago. Cuando el pago se acredite en la cuenta de Open Water, el botón de abajo se activa solo. No cierres esta página mientras tanto.</p>';
      var vb = $('#owc-volver');
      if (vb) vb.addEventListener('click', function () { tok++; clearTimeout(timer); ls(LS, null); out.innerHTML = ''; gen.disabled = false; gen.textContent = 'GENERAR QR DE PAGO'; try { nom.focus(); } catch (e) {} });
      consultar(p, 0, ++tok);
    }

    function acreditado(p) {
      ls(LS, null);
      var b = $('#owc-pagado');
      if (b) { b.disabled = false; b.className = 'owc-btn ok'; b.textContent = '✔ PAGADO · ' + p.mes.toUpperCase(); }
      var s = $('#owc-st');
      if (s) s.innerHTML = '<span style="color:#0f5c2c">✔ Pago acreditado. ¡Gracias, ' + esc(p.nombre.split(' ')[0]) + '!</span>';
      gen.disabled = false; gen.textContent = 'PAGAR OTRO MES';
    }

    function consultar(p, n, mio) {
      clearTimeout(timer);
      if (!vivo || mio !== tok) return;
      post({accion: 'estado', ref: p.ref, evento: 'cuota'}).then(function (j) {
        if (mio !== tok) return;
        if (j && j.estado === 'approved') return acreditado(p);
        if (j && j.estado === 'rejected') {
          var s = $('#owc-st'); if (s) s.innerHTML = '<span style="color:#8a1c10">El pago fue rechazado. Probá de nuevo o con otro medio.</span>';
          return;
        }
        if (n > 240) { var s2 = $('#owc-st'); if (s2) s2.innerHTML = '<span>Seguimos sin ver el pago. Si ya pagaste, escribinos con tu comprobante.</span>'; return; }
        timer = setTimeout(function () { consultar(p, n + 1, mio); }, 5000);
      }).catch(function () { timer = setTimeout(function () { consultar(p, n + 1, mio); }, 8000); });
    }

    gen.addEventListener('click', function () {
      if (gen.disabled) return;
      var falta = faltante();
      if (falta) { hint.textContent = '👆 ' + falta; hint.style.display = 'block'; (nom.value.trim().length < 3 ? nom : mes).focus(); return; }
      var p0 = {nombre: nom.value.trim().replace(/\s+/g, ' '), socio: socio(), mod: modal(), mes: mes.value};
      gen.disabled = true; gen.textContent = 'GENERANDO…'; out.innerHTML = '';
      post({accion: 'crearCuota', evento: 'cuota', nombre: p0.nombre, socio: p0.socio, modalidad: p0.mod, mes: p0.mes}).then(function (j) {
        gen.disabled = false; gen.textContent = 'GENERAR QR DE PAGO';
        if (!j || !j.ok) return error((j && j.error) || 'No se pudo generar el QR. Probá de nuevo en un rato o escribinos a openwaterrionegro@gmail.com.');
        var p = {ref: j.ref, link: j.link, monto: j.monto, nombre: p0.nombre, socio: p0.socio, mod: p0.mod, mes: p0.mes};
        ls(LS, JSON.stringify(p));
        pantallaPago(p);
      }).catch(function () {
        gen.disabled = false; gen.textContent = 'GENERAR QR DE PAGO';
        error('No hay conexión con el servidor de pagos. Revisá tu internet y probá de nuevo.');
      });
    });

    /* si recargó la página con un pago a medias, lo retoma */
    try {
      var g = JSON.parse(ls(LS) || 'null');
      if (g && g.ref && g.link && g.nombre) { nom.value = g.nombre; var r = host.querySelector('input[name=owc-plan][value=' + (g.socio === 'SI' ? 'socio' : 'nosocio') + ':' + g.mod + ']'); if (r) r.checked = true; for (var i = 0; i < mes.options.length; i++) if (mes.options[i].value === g.mes) mes.selectedIndex = i; listo(); pantallaPago(g); }
    } catch (e) {}
    hint.style.display = 'none';
  }

  function buscar(n) {
    var h = document.getElementById('ow-cuota');
    /* las páginas del sitio las dibuja un motor propio (support.js): hay que esperar a que
       termine de dibujar (el contenedor ya está "etiquetado") y recién ahí armar el box */
    if (h && typeof qrcode === 'function' && (h.hasAttribute('data-dc-tpl') || n > 40)) return setTimeout(function () { var h2 = document.getElementById('ow-cuota'); if (h2) montar(h2); }, 900);
    if (n < 120) setTimeout(function () { buscar(n + 1); }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { buscar(0); }); else buscar(0);
  /* red de seguridad: durante los primeros segundos, si el box no está en pantalla se vuelve a armar */
  var vueltas = 0, guardia = setInterval(function () {
    vueltas++;
    var h = document.getElementById('ow-cuota');
    if (h && typeof qrcode === 'function' && !h.querySelector('.owc') && vueltas > 3) { h.removeAttribute('data-owc'); montar(h); }
    if (vueltas > 40) clearInterval(guardia);
  }, 600);
})();
