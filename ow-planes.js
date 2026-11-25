/* Nada con OW · mantiene sincronizada la opción de cuota elegida entre el box de pago de cuota (owc-plan)
   y la ficha de inscripción (ows-plan): si elegís una en uno, queda elegida en el otro, con el mismo monto. */
(function () {
  var busy = false;
  document.addEventListener('change', function (ev) {
    var t = ev.target, n = t && t.name;
    if (busy || (n !== 'owc-plan' && n !== 'ows-plan')) return;
    var otro = document.querySelector('input[name=' + (n === 'owc-plan' ? 'ows-plan' : 'owc-plan') + '][value="' + t.value + '"]');
    if (!otro || otro.checked) return;
    busy = true; try { otro.click(); } finally { busy = false; }
  });
})();
