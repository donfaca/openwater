/* ============================================================================
   OPEN WATER · Contador de visitas y estadísticas públicas
   ----------------------------------------------------------------------------
   FUENTE ÚNICA. Este archivo maneja TODO el contador. Para tocar algo,
   editá SOLO acá (y su copia en sitio-openwater/ow-stats.js).

   Servicio: GoatCounter (gratis, privado). Cuenta visitantes ÚNICOS
   deduplicando por IP + navegador + sal diaria — NO guarda la IP. Un mismo
   IP cuenta 1 vez por día.

   Cómo cambiar la cuenta: editá CODE (el subdominio de GoatCounter).
   ========================================================================== */
(function () {
  'use strict';

  var CODE = 'openwater';                          // <CODE>.goatcounter.com
  var BASE = 'https://' + CODE + '.goatcounter.com';

  // Solo se registran visitas en el sitio real (nunca desde el editor/preview
  // ni localhost), para no inflar el contador con nuestras propias ediciones.
  var PROD = /(^|\.)openwater\.ar$/i.test(location.hostname);

  /* 1) Registrar la visita (solo en producción) ---------------------------- */
  if (PROD) {
    try {
      var s = document.createElement('script');
      s.async = true;
      s.src = '//gc.zgo.at/count.js';
      s.setAttribute('data-goatcounter', BASE + '/count');
      document.head.appendChild(s);
    } catch (e) {}
  }

  /* 2) Helpers -------------------------------------------------------------- */
  function toNum(v) {
    var n = parseInt(String(v == null ? '' : v).replace(/[^\d]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }
  function fmt(n) { return (n || 0).toLocaleString('es-AR'); }

  // Devuelve una Promise<number> con los visitantes únicos de una ruta.
  // path 'TOTAL' = todo el sitio. start opcional = fecha YYYY-MM-DD.
  function counterJson(path, start) {
    var url = BASE + '/counter/' + encodeURIComponent(path) + '.json';
    if (start) url += '?start=' + start;
    return fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return d ? toNum(d.count) : 0; })
      .catch(function () { return 0; });
  }

  function daysAgo(n) {
    var d = new Date(Date.now() - n * 864e5);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  /* 3) API pública ---------------------------------------------------------- */
  window.OWStats = {
    code: CODE,
    base: BASE,
    dashboardUrl: BASE,
    isProd: PROD,
    fmt: fmt,

    // Rellena un elemento con el total de visitantes únicos del sitio.
    fillTotal: function (el) {
      if (!el) return;
      counterJson('TOTAL').then(function (n) {
        el.textContent = n > 0 ? fmt(n) : '—';
      });
    },

    openPanel: function () { buildPanel(); }
  };

  /* 4) Panel propio (modal) ------------------------------------------------- */
  function el(tag, css, txt) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function statCard(label, big) {
    var c = el('div', 'flex:1;min-width:120px;background:#0f3350;border:1px solid #1a5678;border-radius:12px;padding:16px 14px;text-align:center;');
    var num = el('div', "font-family:'Bebas Neue',sans-serif;font-size:34px;line-height:1;color:#fff;", big);
    var lab = el('div', "font-family:'Bebas Neue',sans-serif;letter-spacing:2px;font-size:12px;color:#8bb0c4;margin-top:6px;", label);
    c.appendChild(num); c.appendChild(lab);
    return { root: c, num: num };
  }

  function close() {
    var ov = document.getElementById('ow-stats-ov');
    if (ov) ov.remove();
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) { if (e.key === 'Escape') close(); }

  function buildPanel() {
    if (document.getElementById('ow-stats-ov')) return;

    var ov = el('div', 'position:fixed;inset:0;z-index:100000;background:rgba(4,16,26,.74);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Barlow,system-ui,sans-serif;');
    ov.id = 'ow-stats-ov';
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });

    var box = el('div', 'width:100%;max-width:540px;max-height:90vh;overflow:auto;background:#0a2438;border:1px solid #16455f;border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.55);color:#eaf3f8;');

    // Header
    var hd = el('div', 'position:relative;padding:24px 26px 18px;background:#08202f;border-bottom:1px solid #16455f;');
    hd.appendChild(el('div', "font-family:'Bebas Neue',sans-serif;letter-spacing:3px;font-size:14px;color:#c9a24d;", 'ESTADÍSTICAS DEL SITIO'));
    hd.appendChild(el('div', "font-family:'Bebas Neue',sans-serif;font-size:26px;line-height:1;color:#fff;margin-top:4px;", 'OPEN WATER · RÍO NEGRO'));
    var x = el('button', 'position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:9px;border:1px solid #16455f;background:#0f3350;color:#eaf3f8;font-size:20px;line-height:1;cursor:pointer;', '×');
    x.setAttribute('aria-label', 'Cerrar');
    x.addEventListener('click', close);
    hd.appendChild(x);
    box.appendChild(hd);

    var body = el('div', 'padding:22px 26px 26px;');

    // Hero: total de visitantes únicos
    var hero = el('div', 'background:linear-gradient(135deg,#0f3350,#0b2b44);border:1px solid #1a5678;border-radius:14px;padding:22px 24px;text-align:center;');
    var big = el('div', "font-family:'Bebas Neue',sans-serif;font-size:60px;line-height:.9;color:#fff;", '—');
    hero.appendChild(big);
    hero.appendChild(el('div', "font-family:'Bebas Neue',sans-serif;letter-spacing:3px;font-size:14px;color:#c9a24d;margin-top:6px;", 'VISITANTES ÚNICOS · TODO EL SITIO'));
    hero.appendChild(el('div', 'font-size:13px;color:#a9c6d6;margin-top:10px;line-height:1.5;', 'Cada persona se cuenta una sola vez por día, sin importar cuántas veces entre. Se deduplica por IP sin guardar datos personales.'));
    body.appendChild(hero);

    // Chips por período
    var row = el('div', 'display:flex;gap:10px;margin-top:14px;');
    var c30 = statCard('ÚLTIMOS 30 DÍAS', '—');
    var c7 = statCard('ÚLTIMOS 7 DÍAS', '—');
    row.appendChild(c30.root); row.appendChild(c7.root);
    body.appendChild(row);

    // Botón al panel público completo (ubicaciones, páginas, referencias)
    var geo = el('div', 'margin-top:20px;background:#0c2c40;border:1px solid #1a5678;border-radius:12px;padding:16px 18px;');
    geo.appendChild(el('div', "font-family:'Bebas Neue',sans-serif;letter-spacing:2px;font-size:15px;color:#fff;", 'UBICACIONES Y DETALLE COMPLETO'));
    geo.appendChild(el('div', 'font-size:13px;color:#a9c6d6;margin-top:6px;line-height:1.5;', 'Mapa de lugares desde donde se vio el sitio, páginas más vistas, dispositivos y referencias — panel abierto a todos.'));
    var btn = el('a', 'display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;background:#c9a24d;color:#0a2438;font-weight:800;font-size:15px;padding:13px 18px;border-radius:10px;text-decoration:none;', 'Ver ubicaciones y todo el detalle  →');
    btn.href = BASE; btn.target = '_blank'; btn.rel = 'noopener';
    geo.appendChild(btn);
    body.appendChild(geo);

    body.appendChild(el('div', 'font-size:12px;color:#6f92a6;margin-top:14px;text-align:center;line-height:1.5;', 'Panel público · abierto a todos · los datos se actualizan cada pocas horas.'));

    box.appendChild(body);
    ov.appendChild(box);
    document.body.appendChild(ov);
    document.addEventListener('keydown', onKey);

    // Cargar números en vivo
    counterJson('TOTAL').then(function (n) { big.textContent = n > 0 ? fmt(n) : '—'; });
    counterJson('TOTAL', daysAgo(30)).then(function (n) { c30.num.textContent = n > 0 ? fmt(n) : '0'; });
    counterJson('TOTAL', daysAgo(7)).then(function (n) { c7.num.textContent = n > 0 ? fmt(n) : '0'; });
  }
})();
