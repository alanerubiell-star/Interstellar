/* ------------------------------------------------------------------
   CONFIGURACIÓN DEL NEGOCIO
   Este es el único archivo que necesitas editar para poner a vender.
   Instrucciones paso a paso: docs/LANZAMIENTO.md
   ------------------------------------------------------------------ */
window.COTIZA = {
  // 1. Tu dominio final (sin diagonal al final).
  siteUrl: 'https://cotiza.app',

  // 2. Payment Link de Stripe. Se crea en:
  //    Stripe Dashboard → Productos → Payment links → Crear.
  //    Deja el placeholder y el botón avisa que falta configurarlo.
  stripeLink: 'PENDIENTE_STRIPE_PAYMENT_LINK',

  // 3. Precio mostrado en la página (solo texto; el cobro real lo define Stripe).
  precio: '$9',
  moneda: 'USD',

  // 4. Correo de soporte que ve el cliente.
  soporte: 'hola@cotiza.app',

  // 5. Límite del plan gratis: documentos guardados en el navegador.
  limiteGratis: 3,
};
