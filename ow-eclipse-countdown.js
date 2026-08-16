/* Contador + bloqueo para botones de inscripción de OW Eclipse.
   Marcá el texto del botón con <span data-eclipse-lbl data-open-label="Texto final">…</span>.
   Hasta la hora objetivo, el botón muestra "Abre en HH:MM:SS" y no navega. */
(function(){
  var TARGET = new Date('2026-08-16T23:00:00-03:00').getTime();
  function pad(n){ return String(n).padStart(2,'0'); }
  function fmt(){
    var d = Math.max(0, TARGET - Date.now());
    var dd = Math.floor(d/864e5); d -= dd*864e5;
    var h  = Math.floor(d/36e5);  d -= h*36e5;
    var m  = Math.floor(d/6e4);   d -= m*6e4;
    var s  = Math.floor(d/1e3);
    return (dd>0 ? dd+'d ' : '') + pad(h)+':'+pad(m)+':'+pad(s);
  }
  function block(e){ if(Date.now() < TARGET){ e.preventDefault(); e.stopPropagation(); } }
  function tick(){
    var locked = Date.now() < TARGET;
    var txt = fmt();
    var labels = document.querySelectorAll('[data-eclipse-lbl]');
    for(var i=0;i<labels.length;i++){
      var lbl = labels[i];
      var btn = lbl.closest ? lbl.closest('a,button') : null;
      var open = lbl.getAttribute('data-open-label') || lbl.textContent;
      if(locked){
        lbl.textContent = 'Abre en '+txt;
        if(btn && !btn.__owGated){
          btn.__owGated = true;
          btn.addEventListener('click', block, true);
          btn.style.opacity = '.92';
          btn.style.cursor = 'not-allowed';
          btn.setAttribute('aria-disabled','true');
        }
      } else {
        lbl.textContent = open;
        if(btn && btn.__owGated){
          btn.__owGated = false;
          btn.removeEventListener('click', block, true);
          btn.style.opacity = '';
          btn.style.cursor = '';
          btn.removeAttribute('aria-disabled');
        }
      }
    }
  }
  function start(){ tick(); setInterval(tick, 1000); }
  if(document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
