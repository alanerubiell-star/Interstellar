/* Botón de compra + textos que salen de config.js */
(function () {
  var cfg = window.COTIZA || {};

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  document.querySelectorAll('[data-precio]').forEach(function (el) {
    if (cfg.precio) el.textContent = cfg.precio;
  });

  document.querySelectorAll('[data-soporte]').forEach(function (el) {
    if (!cfg.soporte) return;
    el.textContent = cfg.soporte;
    if (el.tagName === 'A') el.href = 'mailto:' + cfg.soporte;
  });

  var listo = cfg.stripeLink && cfg.stripeLink.indexOf('http') === 0;

  document.querySelectorAll('[data-comprar]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!listo) {
        alert(
          'Falta configurar el cobro.\n\n' +
          'Crea un Payment Link en Stripe y pégalo en ' +
          'public/assets/js/config.js → stripeLink.\n\n' +
          'Los pasos están en docs/LANZAMIENTO.md'
        );
        return;
      }
      // Guarda de dónde vino la compra para saber qué canal convierte.
      try {
        var origen = new URLSearchParams(location.search).get('ref') || document.referrer || 'directo';
        localStorage.setItem('cotiza.origen_compra', origen);
      } catch (e) {}

      window.location.href = cfg.stripeLink;
    });
  });
})();
