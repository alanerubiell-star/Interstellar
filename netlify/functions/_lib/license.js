'use strict';
const crypto = require('crypto');

const PRODUCTO = 'cotiza-pro-v1';

/* Normaliza el correo para que "Ana@Gmail.com " y "ana@gmail.com" den la misma clave. */
function normalizar(email) {
  return String(email || '').trim().toLowerCase();
}

/* Alfabeto sin caracteres que se confunden al teclear (0/O, 1/I/L). */
const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function aClave(buf) {
  let out = '';
  for (let i = 0; i < 12; i++) out += ALFABETO[buf[i] % ALFABETO.length];
  return 'COTIZA-' + out.slice(0, 4) + '-' + out.slice(4, 8) + '-' + out.slice(8, 12);
}

/* La clave es determinista: mismo correo + mismo secreto = misma clave.
   Por eso no hace falta base de datos para emitir ni para validar. */
function generarClave(email, secreto) {
  if (!secreto) throw new Error('Falta LICENSE_SECRET');
  const mac = crypto.createHmac('sha256', secreto)
    .update(normalizar(email) + '|' + PRODUCTO)
    .digest();
  return aClave(mac);
}

function claveValida(email, clave, secreto) {
  if (!email || !clave || !secreto) return false;
  const esperada = generarClave(email, secreto);
  const a = Buffer.from(esperada);
  const b = Buffer.from(String(clave).trim().toUpperCase());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { generarClave, claveValida, normalizar, PRODUCTO };
