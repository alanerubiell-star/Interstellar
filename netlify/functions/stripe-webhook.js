'use strict';
/* Recibe el aviso de pago de Stripe, genera la clave del cliente y se la manda por correo.
   Configuración: docs/LANZAMIENTO.md
   Variables necesarias: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, LICENSE_SECRET
   Opcionales (envío de correo): RESEND_API_KEY, CORREO_REMITENTE, CORREO_SOPORTE */

const Stripe = require('stripe');
const { generarClave } = require('./_lib/license');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Usa POST' };

  const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, LICENSE_SECRET } = process.env;
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !LICENSE_SECRET) {
    console.error('Faltan variables de entorno del webhook.');
    return { statusCode: 500, body: 'Servidor sin configurar' };
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const firma = event.headers['stripe-signature'];

  // Stripe firma el cuerpo tal cual llegó: hay que usar el crudo, no el JSON parseado.
  const crudo = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64')
    : Buffer.from(event.body, 'utf8');

  let evt;
  try {
    evt = stripe.webhooks.constructEvent(crudo, firma, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Firma de webhook inválida:', err.message);
    return { statusCode: 400, body: 'Firma inválida' };
  }

  if (evt.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'ignorado' };
  }

  const sesion = evt.data.object;
  if (sesion.payment_status !== 'paid') {
    return { statusCode: 200, body: 'sin pagar' };
  }

  const email = (sesion.customer_details && sesion.customer_details.email) || sesion.customer_email;
  if (!email) {
    console.error('Sesión pagada sin correo del cliente:', sesion.id);
    return { statusCode: 200, body: 'sin correo' };
  }

  const clave = generarClave(email, LICENSE_SECRET);
  console.log('Licencia emitida para', email, '(sesión', sesion.id + ')');

  try {
    await enviarCorreo(email, clave);
  } catch (err) {
    // Devolver 500 haría que Stripe reintente, y el reintento vuelve a generar
    // la MISMA clave, así que es seguro. Pero preferimos no reintentar en bucle:
    // la clave queda en el log y se puede reenviar a mano con `npm run licencia`.
    console.error('No se pudo enviar el correo a', email, '—', err.message);
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};

async function enviarCorreo(email, clave) {
  const { RESEND_API_KEY, CORREO_REMITENTE, CORREO_SOPORTE, URL } = process.env;
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY no configurada. Manda esta clave a mano:', email, clave);
    return;
  }

  const sitio = URL || 'https://cotiza.app';
  const soporte = CORREO_SOPORTE || 'hola@cotiza.app';
  const enlace = `${sitio}/gracias.html?email=${encodeURIComponent(email)}&clave=${encodeURIComponent(clave)}`;

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;color:#10131a">
      <h1 style="font-size:22px;margin:0 0 16px">Ya tienes Cotiza Pro 🎉</h1>
      <p style="color:#4b5468;line-height:1.6">Gracias por tu compra. Esta es tu clave de licencia:</p>
      <p style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:19px;font-weight:700;
                background:#eef0ff;color:#3b46f1;padding:16px;border-radius:10px;text-align:center;
                letter-spacing:.05em;margin:22px 0">${clave}</p>
      <p style="text-align:center;margin:26px 0">
        <a href="${enlace}" style="background:#3b46f1;color:#fff;text-decoration:none;padding:14px 26px;
           border-radius:9px;font-weight:600;display:inline-block">Activar Pro ahora</a>
      </p>
      <p style="color:#4b5468;line-height:1.6;font-size:14px">
        Ese botón activa tu licencia solo. Si prefieres hacerlo a mano, entra a la herramienta,
        haz clic en <b>Plan gratis</b> arriba a la derecha y pega tu correo y tu clave.
      </p>
      <p style="color:#79839a;font-size:13px;line-height:1.6;border-top:1px solid #e3e7f0;padding-top:16px;margin-top:26px">
        Guarda este correo: la clave sirve en todos tus dispositivos y no caduca.<br>
        ¿Algún problema? Responde aquí o escribe a ${soporte}.
      </p>
    </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: CORREO_REMITENTE || `Cotiza <${soporte}>`,
      to: [email],
      reply_to: soporte,
      subject: 'Tu clave de Cotiza Pro',
      html,
    }),
  });

  if (!res.ok) throw new Error(`Resend respondió ${res.status}: ${await res.text()}`);
}
