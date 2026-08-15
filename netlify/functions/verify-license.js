'use strict';
const { claveValida } = require('./_lib/license');

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Usa POST' }) };
  }

  const secreto = process.env.LICENSE_SECRET;
  if (!secreto) {
    console.error('LICENSE_SECRET no está configurada en el entorno.');
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Servidor sin configurar' }) };
  }

  let datos;
  try {
    datos = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const valida = claveValida(datos.email, datos.clave, secreto);

  // Pequeña espera para que no sirva como oráculo de fuerza bruta.
  if (!valida) await new Promise((r) => setTimeout(r, 400));

  return { statusCode: 200, headers: CORS, body: JSON.stringify({ valida }) };
};
