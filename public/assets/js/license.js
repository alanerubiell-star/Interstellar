/* Activación de licencias Pro.
   La clave se valida contra /api/verify-license (HMAC con secreto del servidor).
   Se guarda el resultado en localStorage para que funcione sin conexión después. */
window.Licencia = (function () {
  var LS = 'cotiza.licencia';

  function leer() {
    try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { return null; }
  }

  function esPro() {
    var l = leer();
    return !!(l && l.ok && l.email && l.clave);
  }

  function guardar(email, clave) {
    localStorage.setItem(LS, JSON.stringify({ ok: true, email: email, clave: clave, ts: Date.now() }));
  }

  function borrar() { localStorage.removeItem(LS); }

  async function verificar(email, clave) {
    var res = await fetch('/api/verify-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, clave: clave }),
    });
    if (!res.ok) throw new Error('No se pudo contactar al servidor de licencias.');
    var data = await res.json();
    if (data.valida) { guardar(email, clave); return true; }
    return false;
  }

  /* Diálogo de activación. Devuelve true si quedó activado. */
  async function pedirClave() {
    var email = prompt('Correo con el que compraste Pro:');
    if (!email) return false;
    var clave = prompt('Pega tu clave de licencia (te llegó por correo):');
    if (!clave) return false;

    try {
      var ok = await verificar(email.trim(), clave.trim());
      if (ok) {
        alert('¡Listo! Pro activado. 🎉');
        return true;
      }
      alert('Esa combinación de correo y clave no es válida.\n\nRevisa que sean exactamente los del correo de compra.');
      return false;
    } catch (e) {
      alert('No pudimos verificar la clave en este momento. Intenta de nuevo en un minuto.');
      return false;
    }
  }

  /* Si Stripe redirige a /gracias.html, se activa solo. */
  async function autoActivarDesdeUrl() {
    var q = new URLSearchParams(location.search);
    var email = q.get('email');
    var clave = q.get('clave') || q.get('key');
    if (!email || !clave) return false;
    try { return await verificar(email.trim(), clave.trim()); } catch (e) { return false; }
  }

  return {
    esPro: esPro,
    pedirClave: pedirClave,
    verificar: verificar,
    autoActivarDesdeUrl: autoActivarDesdeUrl,
    borrar: borrar,
    email: function () { var l = leer(); return l && l.email; },
  };
})();
