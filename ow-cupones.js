/* Panel privado de cupones de equipo (se muestra solo en las listas de inscriptos, que ya piden código). */
(function(){
  var ENDPOINT='https://script.google.com/macros/s/AKfycbzb6IeCxDqL4qFjBWNXBj55gpxA0uVA4fVrHm6-Fa9SqG1zDzR6n1BNI49kQn78gwAUBw/exec';
  var CLAVE='129430';
  var EV=/eclipse/i.test(location.pathname)?'eclipse':'summer';
  var NOM=EV==='eclipse'?'OWeclipse 2.5K':'Summer · Campeonato 5K+10K';
  function post(o){return fetch(ENDPOINT,{method:'POST',body:JSON.stringify(Object.assign({clave:CLAVE,evento:EV},o))}).then(function(r){return r.json();});}
  function el(t,css,txt){var e=document.createElement(t);if(css)e.style.cssText=css;if(txt)e.textContent=txt;return e;}
  function init(){
    if(document.getElementById('ow-cup-fab'))return;
    var fab=el('button','position:absolute;right:24px;top:50%;transform:translateY(-50%);margin-top:9px;z-index:99999;background:#86efac;color:#052e16;border:0;border-radius:999px;padding:9px 16px;font:800 14px Barlow,system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.45);','Cupones de equipo');
    fab.id='ow-cup-fab';
    var box=el('div','position:absolute;right:24px;top:100%;z-index:99999;width:min(360px,calc(100vw - 32px));overflow:auto;background:#0b1a24;color:#fff;border:1px solid #86efac;border-radius:12px;padding:16px;font:14px Barlow,system-ui,sans-serif;display:none;box-shadow:0 12px 34px rgba(0,0,0,.55);');
    var inp='width:100%;box-sizing:border-box;margin:4px 0 10px;padding:9px 10px;border-radius:7px;border:1px solid #3b5a6b;background:#10303f;color:#fff;font:inherit;';
    box.appendChild(el('div','font-weight:800;font-size:16px;color:#86efac;','Cupón de equipo · '+NOM));
    box.appendChild(el('div','font-size:12px;color:#a9c6d6;margin:2px 0 10px;','Aplica el valor por equipo (Summer $212.500, Eclipse $150.000), pago contado. Vale tantas veces como nadadores tenga el grupo; no vence por fecha, solo deja de valer al superar ese número de usos.'));
    box.appendChild(el('label','font-size:12px;color:#a9c6d6;','Equipo (igual a «Club o equipo» de la ficha)'));
    var g=el('input',inp);box.appendChild(g);
    box.appendChild(el('label','font-size:12px;color:#a9c6d6;','Cantidad de nadadores'));
    var n=el('input',inp);n.type='number';n.min='1';box.appendChild(n);
    var go=el('button','width:100%;background:#86efac;color:#052e16;border:0;border-radius:8px;padding:11px;font:800 14px Barlow,system-ui,sans-serif;cursor:pointer;','Generar cupón');
    box.appendChild(go);
    var out=el('div','margin-top:12px;font-size:13px;');box.appendChild(out);
    box.appendChild(el('div','margin-top:14px;font-weight:800;color:#86efac;','Cupones generados'));
    var lst=el('div','margin-top:6px;font-size:13px;');box.appendChild(lst);
    function listar(){lst.textContent='Cargando…';post({accion:'listarCupones'}).then(function(r){
      lst.textContent='';if(!r.ok||!r.cupones.length){lst.textContent=r.ok?'Sin cupones todavía.':(/desconocida/.test(r.error||'')?'Falta publicar la nueva versión del Apps Script.':(r.error||'Error'));return;}
      r.cupones.forEach(function(c){lst.appendChild(el('div','display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid #1d3a4a;','')).innerHTML='<b style="letter-spacing:2px;">'+c.codigo+'</b><span style="color:#a9c6d6;text-align:right;">'+String(c.grupo).replace(/</g,'&lt;')+' · '+c.usados+'/'+c.usos+'</span>';});
    }).catch(function(){lst.textContent='No se pudo cargar.';});}
    go.onclick=function(){
      if(!g.value.trim()){out.textContent='Indicá el equipo.';return;}
      var u=parseInt(n.value,10);if(!u||u<1){out.textContent='Indicá la cantidad de nadadores.';return;}
      go.disabled=true;out.textContent='Generando…';
      post({accion:'generarCupon',grupo:g.value.trim(),usos:u}).then(function(r){
        go.disabled=false;if(!r.ok){out.textContent=/desconocida/.test(r.error||'')?'El Apps Script todavía no tiene la versión con cupones. Pegá el archivo nuevo y publicá una nueva versión.':(r.error||'Error');return;}
        out.innerHTML='Cupón: <b style="font-size:26px;letter-spacing:5px;color:#86efac;">'+r.codigo+'</b><br>Válido para '+u+' nadadores.';
        g.value='';n.value='';listar();
      }).catch(function(){go.disabled=false;out.textContent='No se pudo generar.';});
    };
    fab.onclick=function(){var s=box.style.display==='none';box.style.display=s?'block':'none';if(s)listar();};
    var a=Array.prototype.filter.call(document.querySelectorAll('a'),function(x){return /^\s*←/.test(x.textContent);})[0];
    var host=a&&a.parentElement;
    if(host){host.style.position='relative';host.style.minHeight='40px';box.style.top='100%';box.style.right='16px';fab.style.right='16px';host.appendChild(box);host.appendChild(fab);}
    else{box.style.top='136px';fab.style.top='92px';document.body.appendChild(box);document.body.appendChild(fab);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else setTimeout(init,300);
})();
