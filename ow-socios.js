/* Socio Open Water · ficha de inscripción + pago de la 1ª cuota
   Se monta solo en <div id="ow-socios"></div>. Necesita ow-qrcode.js.
   Habla con el Apps Script de Open Water (acciones socioAlta / estado): guarda la ficha en la
   planilla de socios y devuelve el cobro de Mercado Pago ($80.000, 1ª cuota con remera). */
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxIaZeJVEvJ5pVyrxjSVmxo0oH5Be25zwl6ysPXzY9eNGm8g-TA8unT7LqdKIZWJJsKlg/exec';
  var PRECIO = 80000;
  var TALLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  var LS = 'ow-socio-pendiente';

  function plata(n) { return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }

  function qrSvg(texto, px) {
    var q = qrcode(0, 'M'); q.addData(texto); q.make();
    var n = q.getModuleCount(), m = 3, tot = n + 2 * m, d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px + '" viewBox="0 0 ' + tot + ' ' + tot + '" shape-rendering="crispEdges"><rect width="' + tot + '" height="' + tot + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }

  function hoy() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  var CSS = '' +
    '.ows{max-width:860px;margin:0 auto;padding:28px 28px 30px;border-radius:20px;background:#0f3350;border:1px solid #1a5678;color:#eaf3f8;box-shadow:0 18px 44px rgba(0,0,0,.35);font-family:"Barlow",system-ui,-apple-system,"Segoe UI",sans-serif;text-align:left;box-sizing:border-box}' +
    '.ows *{box-sizing:border-box}' +
    '.ows-g{display:grid;grid-template-columns:1fr 1fr;gap:16px 18px}' +
    '.ows-f{display:flex;flex-direction:column;gap:7px;font-weight:700;font-size:12.5px;letter-spacing:.09em;text-transform:uppercase;color:#8fd4f5;min-width:0}' +
    '.ows-f.full{grid-column:1/-1}' +
    '.ows input[type=text],.ows input[type=tel],.ows input[type=email],.ows input[type=date]{width:100%;padding:13px 14px;border-radius:10px;border:2px solid #1a5678;background:#08202f;color:#fff;font-size:16px;font-family:inherit;font-weight:600;text-transform:none;letter-spacing:0;color-scheme:dark;min-width:0}' +
    '.ows input::placeholder{color:#5f8396;font-weight:500}' +
    '.ows input[type=text]:focus,.ows input[type=tel]:focus,.ows input[type=email]:focus,.ows input[type=date]:focus{outline:none;border-color:#1BCCCE;box-shadow:0 0 0 3px rgba(27,204,206,.25)}' +
    '.ows-ch{display:flex;gap:9px;flex-wrap:wrap}' +
    '.ows-ch label{cursor:pointer;margin:0;flex:0 0 auto}' +
    '.ows-ch.dos label{flex:1 1 200px}' +
    '.ows-ch input{position:absolute;opacity:0;pointer-events:none}' +
    '.ows-ch span{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:58px;padding:11px 14px;border-radius:12px;background:#08202f;border:2px solid #1a5678;font-weight:800;font-size:16px;letter-spacing:.02em;text-transform:none;color:#eaf3f8;text-align:center;line-height:1.2;transition:background .15s,border-color .15s}' +
    '.ows-ch.dos span{align-items:flex-start;text-align:left;padding:12px 16px}' +
    '.ows-ch.dos small{font-weight:500;font-size:13px;color:#a9c6d6;margin-top:2px;letter-spacing:0}' +
    '.ows-ch label:hover span{border-color:#1BCCCE}' +
    '.ows-ch input:checked+span{background:linear-gradient(135deg,#1BCCCE,#10B3BD);border-color:#1BCCCE;color:#04212e}' +
    '.ows-ch input:checked+span small{color:#06394b}' +
    '.ows-ch input:focus-visible+span{outline:3px solid #fff;outline-offset:2px}' +
    '.ows-ter{display:flex;gap:11px;align-items:flex-start;font-size:15px;line-height:1.5;color:#eaf3f8;cursor:pointer;text-transform:none;letter-spacing:0;font-weight:500}' +
    '.ows-ter input{flex:0 0 auto;width:22px;height:22px;margin:1px 0 0;accent-color:#1BCCCE;cursor:pointer}' +
    '.ows details{margin-top:8px;font-size:13.5px;line-height:1.6;color:#bcd6e4;text-transform:none;letter-spacing:0;font-weight:500}' +
    '.ows summary{cursor:pointer;color:#8fd4f5;font-weight:700}' +
    '.ows details ul{margin:8px 0 0;padding-left:20px}' +
    '.ows-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;margin-top:22px;padding:16px 20px;border:0;border-radius:999px;background:linear-gradient(270deg,#D08231,#1BCCCE);color:#04212e;font-family:"Bebas Neue",sans-serif;font-size:28px;letter-spacing:1.5px;cursor:pointer;text-decoration:none;box-shadow:0 12px 30px rgba(27,204,206,.25);transition:transform .15s,opacity .15s}' +
    '.ows-btn:hover:not(:disabled){transform:translateY(-2px)}' +
    '.ows-btn:disabled{opacity:.55;cursor:wait}' +
    '.ows-btn.sec{background:transparent;border:2px solid #1BCCCE;color:#8fd4f5;box-shadow:none;font-size:20px;padding:11px 18px;margin-top:12px}' +
    '.ows-btn.mp{margin-top:0;background:#1BCCCE;box-shadow:0 12px 30px rgba(27,204,206,.3)}' +
    '.ows-hint{display:none;margin-top:14px;padding:11px 14px;border-radius:10px;background:#fff;color:#8a1c10;font-weight:800;font-size:14.5px;border:2px solid #d43b25}' +
    '.ows-err{margin-top:14px;padding:11px 14px;border-radius:10px;background:#fff;color:#8a1c10;font-weight:800;font-size:14.5px;border:2px solid #d43b25}' +
    '.ows-ok{padding:6px 4px;text-align:center}' +
    '.ows-ok .big{font-family:"Bebas Neue",sans-serif;font-size:44px;line-height:1;color:#7ee0a4;margin:2px 0 8px}' +
    '.ows-ok p{margin:0 0 8px;font-size:16px;line-height:1.6;color:#eaf3f8}' +
    '.ows-pago{display:flex;gap:26px;flex-wrap:wrap;align-items:center}' +
    '.ows-info{flex:1 1 280px;min-width:0}' +
    '.ows-info .k{font-family:"Bebas Neue",sans-serif;letter-spacing:4px;font-size:14px;color:#c9a24d}' +
    '.ows-info .t{font-family:"Bebas Neue",sans-serif;font-size:56px;line-height:1;color:#fff;margin:2px 0 6px}' +
    '.ows-info .d{font-size:15.5px;line-height:1.6;margin:0 0 16px;color:#cfe4ee}' +
    '.ows-qr{flex:0 0 auto;text-align:center;font-size:12.5px;color:#a9c6d6;line-height:1.4}' +
    '.ows-qr div{padding:10px;background:#fff;border-radius:12px;line-height:0;margin-bottom:8px}' +
    '.ows-st{display:flex;align-items:center;gap:10px;margin-top:16px;font-weight:700;font-size:14.5px;color:#eaf3f8}' +
    '.ows-dot{flex:0 0 auto;width:12px;height:12px;border-radius:50%;background:#1BCCCE;animation:owsp 1.2s ease-in-out infinite}' +
    '@keyframes owsp{0%,100%{opacity:1}50%{opacity:.2}}' +
    '@media (max-width:640px){.ows{padding:20px 16px 22px;border-radius:16px}.ows-g{grid-template-columns:1fr}.ows-btn{font-size:24px}.ows-info .t{font-size:46px}.ows-pago{justify-content:center}.ows-qr{display:none}#ows-talles{flex-wrap:nowrap;gap:6px}#ows-talles label{flex:1 1 0;min-width:0}#ows-talles span{min-width:0;padding:11px 2px;font-size:15px}}';

  function montar(host) {
    if (host.getAttribute('data-ows')) return;
    host.setAttribute('data-ows', '1');
    if (!document.getElementById('ows-css')) { var st = document.createElement('style'); st.id = 'ows-css'; st.textContent = CSS; document.head.appendChild(st); }

    var talles = TALLES.map(function (t) { return '<label><input type="radio" name="ows-talle" value="' + t + '"><span>' + t + '</span></label>'; }).join('');
    host.innerHTML =
      '<div class="ows" id="ows-box">' +
      '<form id="ows-form" novalidate>' +
      '<div class="ows-g">' +
      '<label class="ows-f full">Nombre y apellido<input type="text" id="ows-nom" autocomplete="name" maxlength="80" placeholder="Como figurás en el documento"></label>' +
      '<label class="ows-f">DNI<input type="text" id="ows-dni" inputmode="numeric" autocomplete="off" maxlength="10" placeholder="Solo números"></label>' +
      '<label class="ows-f">Fecha de nacimiento<input type="date" id="ows-nac" min="1920-01-01" max="' + hoy() + '"></label>' +
      '<label class="ows-f">WhatsApp<input type="tel" id="ows-wa" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="Ej: 2920 123456 (sin 0 ni 15)"></label>' +
      '<label class="ows-f">Email<input type="email" id="ows-mail" autocomplete="email" maxlength="120" placeholder="tucorreo@gmail.com"></label>' +
      '<label class="ows-f full">Ciudad<input type="text" id="ows-ciu" autocomplete="address-level2" maxlength="60" placeholder="Ej: Viedma"></label>' +
      '<div class="ows-f full">Talle de remera <span style="text-transform:none;letter-spacing:0;font-weight:500;color:#a9c6d6;">(obligatorio · incluida en la primera cuota)</span><div class="ows-ch" id="ows-talles">' + talles + '</div></div>' +
      '<div class="ows-f full">Tipo de entrenamiento que preferís<div class="ows-ch dos">' +
      '<label><input type="radio" name="ows-ent" value="general"><span>General<small>Planificación para todo el grupo</small></span></label>' +
      '<label><input type="radio" name="ows-ent" value="personalizado"><span>Personalizado<small>Planificación a tu medida</small></span></label>' +
      '</div></div>' +
      '<div class="ows-f full"><label class="ows-ter"><input type="checkbox" id="ows-ter"><span>Acepto los términos del programa de socios de Open Water Río Negro.</span></label>' +
      '<details><summary>Ver términos</summary><ul>' +
      '<li>Plan único «Socio Open Water»: ' + plata(PRECIO) + ' por mes.</li>' +
      '<li>La primera cuota incluye la remera oficial de Open Water Río Negro, en el talle elegido.</li>' +
      '<li>Todos los meses vas a recibir un recordatorio por email y por WhatsApp con el link para abonar la cuota.</li>' +
      '<li>Los datos de esta ficha se usan solo para gestionar tu membresía, el seguro y la comunicación con los socios.</li>' +
      '</ul></details></div>' +
      '</div>' +
      '<div class="ows-hint" id="ows-hint"></div>' +
      '<div id="ows-out"></div>' +
      '<button type="submit" class="ows-btn" id="ows-go">ENVIAR FICHA Y PAGAR ' + plata(PRECIO) + '</button>' +
      '</form>' +
      '<div id="ows-pan" style="display:none"></div>' +
      '</div>';

    var $ = function (s) { return host.querySelector(s); };
    var form = $('#ows-form'), hint = $('#ows-hint'), out = $('#ows-out'), go = $('#ows-go'), pan = $('#ows-pan');
    var timer = null, vivo = true, tok = 0;

    function val(id) { return $(id).value.replace(/\s+/g, ' ').trim(); }
    function radio(n) { var r = host.querySelector('input[name=' + n + ']:checked'); return r ? r.value : ''; }

    function faltante() {
      if (val('#ows-nom').length < 3) return ['#ows-nom', 'Escribí tu nombre y apellido.'];
      if (val('#ows-dni').replace(/\D/g, '').length < 6) return ['#ows-dni', 'Revisá el DNI (solo números).'];
      var n = $('#ows-nac').value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(n) || n > hoy() || n < '1920-01-01') return ['#ows-nac', 'Completá tu fecha de nacimiento.'];
      if (val('#ows-wa').replace(/\D/g, '').length < 8) return ['#ows-wa', 'Revisá el WhatsApp: con característica, sin 0 ni 15.'];
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('#ows-mail'))) return ['#ows-mail', 'Revisá el email.'];
      if (val('#ows-ciu').length < 2) return ['#ows-ciu', 'Escribí tu ciudad.'];
      if (!radio('ows-talle')) return ['#ows-talles', 'Elegí el talle de remera.'];
      if (!radio('ows-ent')) return ['.ows-ch.dos', 'Elegí el tipo de entrenamiento.'];
      if (!$('#ows-ter').checked) return ['#ows-ter', 'Tenés que aceptar los términos.'];
      return null;
    }
    function mostrarHint(f) { hint.textContent = '👆 ' + f[1]; hint.style.display = 'block'; }
    function revisar() { if (hint.style.display === 'block') { var f = faltante(); if (f) mostrarHint(f); else hint.style.display = 'none'; } }
    ['input', 'change'].forEach(function (ev) { form.addEventListener(ev, revisar); });

    function post(cuerpo) { return fetch(ENDPOINT, {method: 'POST', body: JSON.stringify(cuerpo)}).then(function (r) { return r.json(); }); }
    function error(msg) { out.innerHTML = '<div class="ows-err">' + esc(msg) + '</div>'; }

    function final(html) { tok++; clearTimeout(timer); form.style.display = 'none'; pan.style.display = 'block'; pan.innerHTML = html; }

    function ya(p) {
      final('<div class="ows-ok"><div class="big">¡YA SOS SOCIO OPEN WATER!</div>' +
        '<p>Tu cuota de <b>' + esc(p.mes) + '</b> ya está acreditada' + (p.nSocio ? ' (socio N° ' + esc(p.nSocio) + ')' : '') + '.</p></div>');
    }

    function acreditado(p) {
      ls(LS, null);
      final('<div class="ows-ok"><div class="big">¡YA SOS SOCIO OPEN WATER!</div>' +
        '<p>Recibimos tu pago de <b>' + esc(p.mes) + '</b>, ' + esc(p.nombre.split(' ')[0]) + '. ¡Gracias por sumarte!</p>' +
        (p.primera ? '<p>Tu primera cuota incluye la <b>remera oficial</b>' + (p.talle ? ' (talle <b>' + esc(p.talle) + '</b>)' : '') + ': te avisamos por WhatsApp cuándo retirarla.</p>' : '') +
        '<p style="font-size:14px;color:#a9c6d6;">Te enviamos un mail de confirmación. Todos los meses vas a recibir el recordatorio con el link para pagar la cuota.</p></div>');
    }

    function volver() {
      tok++; clearTimeout(timer); ls(LS, null);
      pan.innerHTML = ''; pan.style.display = 'none'; form.style.display = '';
      try { form.scrollIntoView({behavior: 'smooth', block: 'start'}); } catch (e) {}
    }

    function pantallaPago(p) {
      var mio = ++tok;
      form.style.display = 'none'; pan.style.display = 'block';
      pan.innerHTML =
        '<div class="ows-pago">' +
        '<div class="ows-info">' +
        '<div class="k">' + (p.primera ? 'PRIMERA CUOTA · INCLUYE REMERA' : 'CUOTA DEL MES') + '</div>' +
        '<div class="t">' + plata(p.monto) + '</div>' +
        '<p class="d"><b>' + esc(p.nombre) + '</b><br>Socio Open Water · cuota de <b>' + esc(p.mes) + '</b><br>' + (p.primera ? 'Tu ficha ya quedó guardada. Solo falta el pago.' : '') + '</p>' +
        '<a class="ows-btn mp" href="' + esc(p.link) + '" target="_blank" rel="noopener">PAGAR CON MERCADO PAGO</a>' +
        '<div class="ows-st" id="ows-st"><span class="ows-dot"></span><span>Esperando el pago… Cuando se acredite, esta pantalla se actualiza sola.</span></div>' +
        '</div>' +
        '<div class="ows-qr"><div>' + qrSvg(p.link, 168) + '</div>Si estás en la compu,<br>escaneá el QR con el celular</div>' +
        '</div>' +
        '<button type="button" class="ows-btn sec" id="ows-volver">← VOLVER A LA FICHA</button>' +
        '<p style="margin:10px 0 0;font-size:13px;line-height:1.5;color:#a9c6d6;text-align:center;">¿Cambiaste de idea o querés corregir un dato? Podés volver: tu ficha queda guardada y el cobro se reutiliza cuando la reenvíes.</p>';
      pan.querySelector('#ows-volver').addEventListener('click', volver);
      consultar(p, 0, mio);
    }

    function consultar(p, n, mio) {
      clearTimeout(timer);
      if (!vivo || mio !== tok) return;
      post({accion: 'estado', ref: p.ref, evento: 'socio'}).then(function (j) {
        if (mio !== tok) return;
        if (j && j.estado === 'approved') return acreditado(p);
        var s = host.querySelector('#ows-st');
        if (j && j.estado === 'rejected') { if (s) s.innerHTML = '<span style="color:#ff9b8a">El pago fue rechazado. Probá de nuevo con otro medio desde el botón.</span>'; }
        if (n > 360) { if (s) s.innerHTML = '<span>Seguimos sin ver el pago. Si ya pagaste, quedá tranquilo/a: se anota solo y te llega un mail. Ante cualquier duda escribinos.</span>'; return; }
        timer = setTimeout(function () { consultar(p, n + 1, mio); }, 5000);
      }).catch(function () { timer = setTimeout(function () { consultar(p, n + 1, mio); }, 8000); });
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (go.disabled) return;
      var f = faltante();
      if (f) { mostrarHint(f); var el = $(f[0]); if (el) { try { el.scrollIntoView({behavior: 'smooth', block: 'center'}); } catch (e) {} if (el.focus && el.tagName === 'INPUT') el.focus(); } return; }
      hint.style.display = 'none'; out.innerHTML = '';
      var datos = {accion: 'socioAlta', evento: 'socio', nombre: val('#ows-nom'), dni: val('#ows-dni').replace(/\D/g, ''), nacimiento: $('#ows-nac').value, whatsapp: val('#ows-wa'), email: val('#ows-mail'), ciudad: val('#ows-ciu'), talle: radio('ows-talle'), entrenamiento: radio('ows-ent'), terminos: true};
      go.disabled = true; go.textContent = 'GUARDANDO…';
      post(datos).then(function (j) {
        go.disabled = false; go.textContent = 'ENVIAR FICHA Y PAGAR ' + plata(PRECIO);
        if (!j || !j.ok) return error((j && j.error) || 'No se pudo enviar la ficha. Probá de nuevo en un rato o escribinos a openwaterrionegro@gmail.com.');
        if (j.yaPagado) return ya(j);
        var p = {ref: j.ref, link: j.link, monto: j.monto, nombre: datos.nombre, mes: j.mes, primera: !!j.primera, talle: datos.talle, nSocio: j.nSocio};
        ls(LS, JSON.stringify(p));
        pantallaPago(p);
        try { host.scrollIntoView({behavior: 'smooth', block: 'start'}); } catch (e) {}
      }).catch(function () {
        go.disabled = false; go.textContent = 'ENVIAR FICHA Y PAGAR ' + plata(PRECIO);
        error('No hay conexión con el servidor. Revisá tu internet y probá de nuevo.');
      });
    });

    /* si recargó la página con un pago a medias, retoma la pantalla de pago (la ficha ya está guardada) */
    try {
      var g = JSON.parse(ls(LS) || 'null');
      if (g && g.ref && g.link && g.nombre) pantallaPago(g);
    } catch (e) {}
  }

  function buscar(n) {
    var h = document.getElementById('ow-socios');
    /* las páginas del sitio las dibuja un motor propio (support.js): hay que esperar a que
       termine de dibujar (el contenedor ya está "etiquetado") y recién ahí armar el formulario */
    if (h && typeof qrcode === 'function' && (h.hasAttribute('data-dc-tpl') || n > 40)) return setTimeout(function () { var h2 = document.getElementById('ow-socios'); if (h2) montar(h2); }, 900);
    if (n < 120) setTimeout(function () { buscar(n + 1); }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { buscar(0); }); else buscar(0);
  /* red de seguridad: durante los primeros segundos, si el formulario no está en pantalla se vuelve a armar
     (solo si todavía no se envió nada: no pisa la pantalla de pago ni la de «ya sos socio») */
  var vueltas = 0, guardia = setInterval(function () {
    vueltas++;
    var h = document.getElementById('ow-socios');
    if (h && typeof qrcode === 'function' && !h.querySelector('.ows') && vueltas > 3) { h.removeAttribute('data-ows'); montar(h); }
    if (vueltas > 40) clearInterval(guardia);
  }, 600);
})();
