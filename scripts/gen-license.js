#!/usr/bin/env node
'use strict';
/* Emite una clave a mano — para reenvíos, soporte, ventas fuera de Stripe o regalos.
   Uso:  LICENSE_SECRET=xxx npm run licencia -- cliente@correo.com          */

const { generarClave, normalizar } = require('../netlify/functions/_lib/license');

const email = process.argv[2];
const secreto = process.env.LICENSE_SECRET;

if (!email) {
  console.error('Uso: LICENSE_SECRET=xxx npm run licencia -- cliente@correo.com');
  process.exit(1);
}
if (!secreto) {
  console.error('Falta LICENSE_SECRET.\nDebe ser exactamente la misma que tienes en Netlify.');
  console.error('Para generar una nueva:  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

console.log('');
console.log('  Correo:  ' + normalizar(email));
console.log('  Clave:   ' + generarClave(email, secreto));
console.log('');
console.log('  El cliente debe activar con ese correo EXACTO (en minúsculas da igual).');
console.log('');
