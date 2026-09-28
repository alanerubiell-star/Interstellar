/**
 * Prueba de contrato del backend, sin gastar API real.
 *
 * Levanta un endpoint que suplanta al de Anthropic, apunta el servidor de Noa
 * hacia él con ANTHROPIC_BASE_URL y comprueba dos cosas:
 *   1. que la petición saliente lleve exactamente lo que debe (modelo, betas,
 *      fallbacks, thinking, effort, caché del prompt y el esquema de salida), y
 *   2. que la respuesta atraviese el parseo, la validación y la ruta HTTP.
 *
 * También ejercita validación de entrada, límite de peticiones y el caso sin
 * credenciales. Con ANTHROPIC_API_KEY real, `npm run smoke:api` hace la llamada
 * de verdad; esto es lo que corre en CI.
 *
 *   npm run contract
 */
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { setTimeout as espera } from 'node:timers/promises'

const PUERTO_FALSO = 8799
const PUERTO_NOA = 8798
const API = `http://127.0.0.1:${PUERTO_NOA}`

const fallos = []
const ok = []
const check = (cond, etiqueta) => (cond ? ok.push(etiqueta) : fallos.push(etiqueta))

/* ---------- endpoint que suplanta a la API de Anthropic ---------- */

let ultimaPeticion = null
let ultimasCabeceras = null

const NOTA = {
  note: {
    motivo: 'Odinofagia y fiebre de 3 días de evolución',
    padecimientoActual: 'Paciente refiere odinofagia y fiebre de 38.6 °C.',
    exploracionFisica: 'Orofaringe hiperémica con exudado amigdalino bilateral.',
    signosVitales: { ta: '118/76', fc: '92', fr: '18', temp: '38.4', sato2: '98', peso: '', talla: '' },
    diagnosticos: [{ cie10: 'J03.9', texto: 'Amigdalitis aguda, no especificada' }],
    plan: ['Antibioticoterapia con amoxicilina por 7 días.'],
    indicaciones: ['Tomar el antibiótico completo.', 'Acudir a urgencias si no puede tragar líquidos.'],
    receta: [{ farmaco: 'Amoxicilina 500 mg', dosis: '1 cápsula', via: 'Oral', frecuencia: 'Cada 8 horas', duracion: '7 días' }],
    pronostico: 'Bueno para la vida y la función.',
  },
  revision: {
    confianza: 'alta',
    alertas: ['El paciente tiene registrada alergia a penicilina: verificar la amoxicilina.'],
  },
}

for (const puerto of [PUERTO_NOA, PUERTO_FALSO]) {
  try {
    await fetch(`http://127.0.0.1:${puerto}/api/health`, { signal: AbortSignal.timeout(700) })
    console.error(
      `El puerto ${puerto} ya está ocupado por otro proceso. Ciérralo antes de correr el contrato.`,
    )
    process.exit(1)
  } catch { /* libre, que es lo esperado */ }
}

const falso = createServer((req, res) => {
  let cuerpo = ''
  req.on('data', (c) => (cuerpo += c))
  req.on('end', () => {
    ultimaPeticion = JSON.parse(cuerpo || '{}')
    ultimasCabeceras = req.headers
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        id: 'msg_contrato',
        type: 'message',
        role: 'assistant',
        model: ultimaPeticion.model,
        content: [{ type: 'text', text: JSON.stringify(NOTA) }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 1200,
          output_tokens: 480,
          cache_read_input_tokens: 1000,
          cache_creation_input_tokens: 0,
        },
      }),
    )
  })
})
await new Promise((r) => falso.listen(PUERTO_FALSO, '127.0.0.1', r))

/* ---------- arranca el servidor de Noa apuntando al endpoint falso ---------- */

function arrancarNoa(extra = {}) {
  const proc = spawn('./node_modules/.bin/tsx', ['server/index.ts'], {
    env: {
      ...process.env,
      PORT: String(PUERTO_NOA),
      ANTHROPIC_BASE_URL: `http://127.0.0.1:${PUERTO_FALSO}`,
      ANTHROPIC_API_KEY: 'sk-ant-contrato',
      NOA_RATE_MAX: '3',
      NOA_RATE_WINDOW_MS: '60000',
      ...extra,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })
  proc.stdout.on('data', () => {})
  proc.stderr.on('data', () => {})
  return proc
}

/** Mata el grupo entero: matar sólo al lanzador deja al servidor escuchando. */
function detener(proc) {
  try { process.kill(-proc.pid, 'SIGKILL') } catch { proc.kill('SIGKILL') }
}

async function esperarPuertoLibre() {
  for (let i = 0; i < 40; i++) {
    try {
      await fetch(`${API}/api/health`)
    } catch {
      return true
    }
    await espera(250)
  }
  return false
}

async function esperarListo() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${API}/api/health`)
      if (r.ok) return true
    } catch { /* aún no levanta */ }
    await espera(250)
  }
  return false
}

const TRANSCRIPT = [
  { t: 2, hablante: 'desconocido', texto: 'Doctor, tengo tres días con dolor de garganta y fiebre.' },
  { t: 9, hablante: 'desconocido', texto: 'Vamos a revisar. Tiene las amígdalas con placas blancas.' },
]

let noa = arrancarNoa()
if (!(await esperarListo())) {
  console.error('el servidor de Noa no levantó')
  detener(noa); falso.close(); process.exit(1)
}

/* ---------- 1. salud ---------- */
{
  const salud = await (await fetch(`${API}/api/health`)).json()
  check(salud.ok === true, 'health responde ok')
  check(salud.modelo === 'claude-opus-5', `health reporta claude-opus-5 (fue ${salud.modelo})`)
  check(salud.credenciales === true, 'health reporta credenciales presentes')
}

/* ---------- 2. generación completa ---------- */
{
  const r = await fetch(`${API}/api/note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      motivo: 'dolor de garganta',
      transcript: TRANSCRIPT,
      paciente: { edad: 34, sexo: 'F', alergias: ['Penicilina'], antecedentes: ['Rinitis alérgica'] },
    }),
  })
  const cuerpo = await r.json()

  check(r.status === 200, `POST /api/note devuelve 200 (fue ${r.status})`)
  check(cuerpo.note?.diagnosticos?.[0]?.cie10 === 'J03.9', 'la nota parseada llega al cliente')
  check(cuerpo.revision?.alertas?.length === 1, 'las alertas de revisión llegan al cliente')
  check(cuerpo.uso?.cacheLeido === 1000, 'el uso de caché se reporta')

  /* --- la petición saliente hacia Anthropic --- */
  const p = ultimaPeticion
  if (!p) {
    fallos.push('el servidor no emitió ninguna petición hacia la API')
    console.error(`  respuesta recibida: ${r.status} ${JSON.stringify(cuerpo).slice(0, 200)}`)
    detener(noa); falso.close()
    for (const f of fallos) console.error(`  ✗ ${f}`)
    process.exit(1)
  }
  check(p.model === 'claude-opus-5', `modelo saliente claude-opus-5 (fue ${p.model})`)
  check(p.thinking?.type === 'adaptive', 'thinking adaptativo')
  check(p.thinking?.budget_tokens === undefined, 'sin budget_tokens (rechazado por Opus 5)')
  check(p.output_config?.effort === 'high', `effort high (fue ${p.output_config?.effort})`)
  check(p.output_config?.format?.type === 'json_schema', 'salida estructurada por esquema JSON')
  check(p.fallbacks === 'default', `fallbacks "default" (fue ${JSON.stringify(p.fallbacks)})`)
  check(p.max_tokens === 16000, `max_tokens 16000 (fue ${p.max_tokens})`)
  check(p.temperature === undefined && p.top_p === undefined, 'sin parámetros de muestreo')

  const beta = String(ultimasCabeceras['anthropic-beta'] ?? '')
  check(beta.includes('server-side-fallback-2026-07-01'), `beta de fallback presente (fue "${beta}")`)

  const sistema = p.system?.[0]
  check(sistema?.cache_control?.type === 'ephemeral', 'prompt de sistema marcado para caché')
  check(/NOM-004/.test(sistema?.text ?? ''), 'el prompt de sistema exige la estructura NOM-004')

  const esquema = JSON.stringify(p.output_config?.format?.schema ?? {})
  check(esquema.includes('padecimientoActual') && esquema.includes('alertas'),
    'el esquema enviado incluye nota y revisión')

  const usuario = p.messages?.[0]?.content ?? ''
  check(usuario.includes('Penicilina'), 'las alergias del paciente viajan en el mensaje')
  check(usuario.includes('dolor de garganta'), 'la transcripción viaja en el mensaje')
  check(!JSON.stringify(p).includes('sk-ant-contrato'), 'la llave no viaja en el cuerpo')
}

/* ---------- 3. validación de entrada ---------- */
{
  const r = await fetch(`${API}/api/note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: [] }),
  })
  const cuerpo = await r.json()
  check(r.status === 400, `transcripción vacía devuelve 400 (fue ${r.status})`)
  check(!JSON.stringify(cuerpo).includes('garganta'), 'el error no refleja contenido clínico')
}

/* ---------- 4. límite de peticiones ---------- */
{
  let visto429 = false
  for (let i = 0; i < 6; i++) {
    const r = await fetch(`${API}/api/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo: '', transcript: TRANSCRIPT }),
    })
    if (r.status === 429) { visto429 = true; break }
  }
  check(visto429, 'el límite de peticiones responde 429')
}

detener(noa)
if (!(await esperarPuertoLibre())) fallos.push('el primer servidor no liberó el puerto')

/* ---------- 5. sin credenciales ---------- */
{
  noa = arrancarNoa({ ANTHROPIC_API_KEY: '', NOA_RATE_MAX: '50' })
  if (!(await esperarListo())) {
    fallos.push('el servidor no levanta sin ANTHROPIC_API_KEY')
  } else {
    const salud = await (await fetch(`${API}/api/health`)).json()
    check(salud.credenciales === false, 'health reporta la falta de credenciales')

    const r = await fetch(`${API}/api/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo: '', transcript: TRANSCRIPT }),
    })
    const cuerpo = await r.json()
    check(r.status === 503, `sin credenciales devuelve 503 (fue ${r.status})`)
    check(cuerpo.error === 'sin_credenciales', 'el código de error es sin_credenciales')
  }
  detener(noa)
}

falso.close()

for (const o of ok) console.log(`  ✓ ${o}`)
if (fallos.length) {
  console.error(`\n${fallos.length} fallo(s):`)
  for (const f of fallos) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log(`\n${ok.length} comprobaciones de contrato, todas verdes`)
