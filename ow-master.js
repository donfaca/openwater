/* ow-master.js — lee el Google Sheet maestro (pestañas «Mesa de control» y «Criterios») y publica los datos en window.OWMaster. */
(function () {
  var ID = '1T0h58ImuS_XtiDZgCmCoiE5sGZAoGadLqXQsgz_BEsk', PERIODO = 20000;
  var M = window.OWMaster = { ok: false, hora: '', error: '', tiempos: {}, estados: {}, obs: {}, estadosAll: {}, puntos: null, criterios: [], subs: [], url: 'https://docs.google.com/spreadsheets/d/' + ID + '/edit',
    on: function (f) { M.subs.push(f); }, off: function (f) { M.subs = M.subs.filter(function (x) { return x !== f; }); }, refresh: refresh };
  function norm(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function csv(t) {
    var rows = [], row = [], c = '', q = false, i, ch;
    for (i = 0; i < t.length; i++) {
      ch = t[i];
      if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { row.push(c); c = ''; }
      else if (ch === '\n') { row.push(c); rows.push(row); row = []; c = ''; }
      else if (ch !== '\r') c += ch;
    }
    if (c !== '' || row.length) { row.push(c); rows.push(row); }
    return rows;
  }
  function hoja(nombre) {
    return fetch('https://docs.google.com/spreadsheets/d/' + ID + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(nombre) + '&_=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }).then(csv);
  }
  function tiempo(v) {
    v = String(v == null ? '' : v).trim(); if (!v) return '';
    v = v.replace('.', ',').replace(/^(\d+):(\d{2}):(\d{1,2})$/, '$1:$2,$3');
    return /^\d+:\d{2},\d{1,2}$|^\d{1,2},\d{1,2}$|^\d+:\d{2}$|^\d{1,2}$/.test(v) ? v : '';
  }
  function mesa(rows) {
    var h = rows[0].map(norm), ix = function (f) { return h.findIndex(f); };
    var cP = ix(function (x) { return x === 'prueba n°' || x === 'prueba n' || x === 'n° prueba'; }), cG = ix(function (x) { return x === 'genero' || x === 'sexo'; }),
      cNP = h.findIndex(function (x, i) { return i !== cP && x === 'prueba'; }), cS = ix(function (x) { return x.indexOf('serie') === 0; }), cA = ix(function (x) { return x.indexOf('andarivel') === 0; }),
      cN = ix(function (x) { return /nadador|equipo/.test(x); }), cC = ix(function (x) { return x.indexOf('club') === 0; }), cR = ix(function (x) { return x.indexOf('cat') === 0; }),
      cV = ix(function (x) { return x.indexOf('sembr') >= 0; }), cF = ix(function (x) { return x.indexOf('tiempo final') >= 0; }), cE = ix(function (x) { return x === 'estado'; }), cO = ix(function (x) { return x.indexOf('obs') === 0; });
    if (cP < 0 || cS < 0 || cA < 0 || cN < 0) throw new Error('Mesa de control: faltan columnas');
    var P = {}, T = {}, E = {}, EA = {}, OB = {}, n = 0;
    rows.slice(1).forEach(function (r) {
      var pn = parseInt(r[cP], 10), sn = parseInt(r[cS], 10), c = parseInt(r[cA], 10), nom = String(r[cN] || '').trim();
      if (!pn || !sn || !c || !nom) return;
      var pname = ((cG >= 0 ? r[cG] : '') + ' ' + (cNP >= 0 ? r[cNP] : '')).trim(), rel = /relevo/i.test(pname);
      var p = P[pn] = P[pn] || { n: pn, nombre: pname, relevo: rel, series: {} }, s = p.series[sn] = p.series[sn] || { n: sn, carriles: {} }, integ = '';
      if (rel) { var m = /^(.*?)\s*\((.*)\)\s*$/.exec(nom); if (m) { nom = m[1]; integ = m[2]; } }
      var semb = rel ? String(r[cR] || '').trim() : String(r[cV] || '').trim() || 'NT';
      s.carriles[c] = { c: c, nombre: nom, club: String(r[cC] || '').trim(), sembrado: semb, integrantes: integ }; n++;
      var key = pn + '-' + sn + '-' + c, t = cF >= 0 ? tiempo(r[cF]) : ''; if (t) T[key] = t;
      var e = cE >= 0 ? String(r[cE] || '').trim().toUpperCase() : ''; if (e) EA[key] = e; if (e && e !== 'OK') E[key] = e; var ob = cO >= 0 ? String(r[cO] || '').trim() : ''; if (ob) OB[key] = ob;
    });
    if (!n) throw new Error('Mesa de control vacía');
    var out = Object.keys(P).map(Number).sort(function (a, b) { return a - b; }).map(function (k) {
      var p = P[k], ss = Object.keys(p.series).map(Number).sort(function (a, b) { return a - b; });
      return { n: p.n, nombre: p.nombre, relevo: p.relevo, series: ss.map(function (sn) { var s = p.series[sn], cs = [], i; for (i = 1; i <= 6; i++) cs.push(s.carriles[i] || { c: i, libre: true }); return { n: s.n, de: ss.length, carriles: cs }; }) };
    });
    return { pruebas: out, tiempos: T, estados: E, estadosAll: EA, obs: OB };
  }
  function num(x) { var v = parseFloat(String(x).replace(',', '.')); return isNaN(v) ? null : v; }
  function criterios(rows) {
    var ind = {}, rel = {}, found = false, i, j;
    for (i = 0; i < rows.length && !found; i++) {
      var r = rows[i].map(norm), pc = r.findIndex(function (x) { return /^(puesto|posicion|lugar|pos\.?)/.test(x); });
      var pcs = []; r.forEach(function (x, k) { if (k !== pc && /punt|pts/.test(x)) pcs.push(k); });
      if (pc < 0 || !pcs.length) continue;
      var hasRel = pcs.some(function (k) { return /relevo|posta/.test(r[k]); });
      for (j = i + 1; j < rows.length; j++) {
        var pu = parseInt(String(rows[j][pc]).replace(/[^\d]/g, ''), 10); if (!pu) { if (norm(rows[j].join('')) === '') break; else continue; }
        pcs.forEach(function (k, idx) { var v = num(rows[j][k]); if (v === null) return; var isRel = hasRel ? /relevo|posta/.test(r[k]) : idx === 1; (isRel ? rel : ind)[pu] = v; found = true; });
        if (!hasRel && pcs.length === 1) { var v1 = num(rows[j][pcs[0]]); if (v1 !== null) ind[pu] = v1; }
      }
    }
    if (!found) {
      var mode = ind;
      rows.forEach(function (row) { row.forEach(function (cell) {
        var t = String(cell || '').trim(), m = /^(\d+)\s*[°ºo.]?\s*(?:puesto|lugar|pos\.?)?\s*[:=\-–→]\s*(\d+(?:[.,]\d+)?)\s*(?:pts?|puntos?)?$/i.exec(t);
        if (m) { mode[parseInt(m[1], 10)] = num(m[2]); found = true; } else if (/relevo|posta/i.test(t) && !/\d\s*[:=]/.test(t)) mode = rel; else if (/individual/i.test(t) && !/\d\s*[:=]/.test(t)) mode = ind;
      }); });
    }
    if (!found) return null;
    return { ind: ind, rel: Object.keys(rel).length ? rel : ind };
  }
  function avisar() { M.subs.slice().forEach(function (f) { try { f(); } catch (e) {} }); }
  function refresh() {
    return hoja('Mesa de control').then(function (rows) {
      var d = mesa(rows), D = window.OW_TORNEO; if (D) D.pruebas = d.pruebas;
      M.tiempos = d.tiempos; M.estados = d.estados; M.estadosAll = d.estadosAll; M.obs = d.obs; M.ok = true; M.error = '';
      M.hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return hoja('Criterios').then(function (cr) { M.criterios = cr.map(function (r) { return r.filter(function (x) { return String(x).trim(); }).join(' · '); }).filter(Boolean); M.puntos = criterios(cr); }).catch(function () {});
    }).catch(function (e) { M.error = String(e && e.message || e); }).then(avisar);
  }
  refresh(); setInterval(refresh, PERIODO);
})();
