/**
 * Prueba de integración de extremo a extremo con backend.
 *
 * Levanta el endpoint que suplanta a Anthropic y el servidor de Noa, compila la
 * app apuntándola a ese servidor y recorre en el navegador el flujo completo:
 * grabar → generar → ver la nota. Comprueba que lo que se pinta en pantalla sea
 * lo que devolvió el backend (y no el guion de demostración), y que el panel de
 * alertas previo a la firma aparezca.
 *
 *   npm run smoke:backend
 *   CHROMIUM_PATH=/ruta/a/chromium npm run smoke:backend
 */
import { chromium } from 'playwright'
import { spawn, execSync } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdirSync } from 'node:fs'
import { setTimeout as espera } from 'node:timers/promises'

const P_FALSO = 8799
const P_NOA = 8798
const P_WEB = 4174
const OUT = '.smoke'
const EJECUTABLE = process.env.CHROMIUM_PATH

mkdirSync(OUT, { recursive: true })
const fallos = []
const check = (c, etiqueta) => { if (!c) fallos.push(etiqueta); else console.log(`  ✓ ${etiqueta}`) }

// Marcadores inconfundibles: si aparecen en pantalla, vinieron del backend.
const MARCA_DX = 'Faringoamigdalitis aguda estreptocócica'
const MARCA_ALERTA = 'Verificar la amoxicilina: el expediente registra alergia a penicilina.'

const NOTA = {
  note: {
    motivo: 'Odinofagia y fiebre de tres días de evolución',
    padecimientoActual: 'Paciente refiere odinofagia intensa y fiebre de hasta 38.6 °C de tres días de evolución.',
    exploracionFisica: 'Orofaringe hiperémica con exudado amigdalino bilateral y adenopatías cervicales dolorosas.',
    signosVitales: { ta: '118/76', fc: '92', fr: '18', temp: '38.4', sato2: '98', peso: '', talla: '' },
    diagnosticos: [{ cie10: 'J03.0', texto: MARCA_DX }],
    plan: ['Antibioticoterapia empírica por siete días.', 'Cita de control en una semana.'],
    indicaciones: ['Completar el antibiótico aunque mejore antes.', 'Acudir a urgencias si no tolera líquidos.'],
    receta: [{ farmaco: 'Amoxicilina 500 mg', dosis: '1 cápsula', via: 'Oral', frecuencia: 'Cada 8 horas', duracion: '7 días' }],
    pronostico: 'Bueno para la vida y la función.',
  },
  revision: { confianza: 'media', alertas: [MARCA_ALERTA] },
}

for (const puerto of [P_NOA, P_FALSO]) {
  try {
    await fetch(`http://127.0.0.1:${puerto}/api/health`, { signal: AbortSignal.timeout(700) })
    console.error(`El puerto ${puerto} está ocupado. Ciérralo antes de correr esta prueba.`)
    process.exit(1)
  } catch { /* libre */ }
}

/* ---------- endpoint que suplanta a Anthropic ---------- */
const falso = createServer((req, res) => {
  let cuerpo = ''
  req.on('data', (c) => (cuerpo += c))
  req.on('end', () => {
    const peticion = JSON.parse(cuerpo || '{}')
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      id: 'msg_e2e', type: 'message', role: 'assistant', model: peticion.model,
      content: [{ type: 'text', text: JSON.stringify(NOTA) }],
      stop_reason: 'end_turn', stop_sequence: null,
      usage: { input_tokens: 900, output_tokens: 400, cache_read_input_tokens: 800, cache_creation_input_tokens: 0 },
    }))
  })
})
await new Promise((r) => falso.listen(P_FALSO, '127.0.0.1', r))

/* ---------- servidor de Noa ---------- */
const noa = spawn('./node_modules/.bin/tsx', ['server/index.ts'], {
  env: {
    ...process.env,
    PORT: String(P_NOA),
    ANTHROPIC_BASE_URL: `http://127.0.0.1:${P_FALSO}`,
    ANTHROPIC_API_KEY: 'sk-ant-e2e',
    NOA_ALLOWED_ORIGINS: `http://127.0.0.1:${P_WEB},http://localhost:${P_WEB}`,
    NOA_RATE_MAX: '50',
  },
  stdio: ['ignore', 'pipe', 'pipe'], detached: true,
})
noa.stdout.on('data', () => {}); noa.stderr.on('data', () => {})
const detener = (p) => { try { process.kill(-p.pid, 'SIGKILL') } catch { p.kill('SIGKILL') } }

let listo = false
for (let i = 0; i < 60 && !listo; i++) {
  try { listo = (await fetch(`http://127.0.0.1:${P_NOA}/api/health`)).ok } catch { await espera(250) }
}
if (!listo) { console.error('el servidor de Noa no levantó'); detener(noa); falso.close(); process.exit(1) }

/* ---------- build apuntando al backend ---------- */
console.log('compilando la app contra el backend…')
execSync('npm run build', {
  stdio: 'ignore',
  env: { ...process.env, VITE_NOA_API: `http://127.0.0.1:${P_NOA}` },
})

const web = spawn('npx', ['vite', 'preview', '--port', String(P_WEB), '--host', '127.0.0.1'], { stdio: 'ignore', detached: true })
const BASE = `http://127.0.0.1:${P_WEB}`
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(BASE)).ok) break } catch { await espera(250) }
}

/* ---------- recorrido ---------- */
const browser = await chromium.launch({
  ...(EJECUTABLE ? { executablePath: EJECUTABLE } : {}),
  args: ['--no-sandbox'],
})
const errores = []

try {
  for (const [nombre, viewport, isMobile] of [
    ['movil', { width: 390, height: 844 }, true],
    ['escritorio', { width: 1440, height: 900 }, false],
  ]) {
    const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, locale: 'es-MX' })
    const page = await ctx.newPage()
    page.on('console', (m) => { if (m.type() === 'error') errores.push(`[${nombre}] ${m.text()}`) })
    page.on('pageerror', (e) => errores.push(`[${nombre}] ${e.message}`))

    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Comenzar' }).click()
    await page.waitForSelector('text=Consultas hoy')

    await page.goto(`${BASE}/#/consulta/nueva`, { waitUntil: 'networkidle' })
    // Paciente con alergia registrada: es lo que dispara la alerta del backend.
    await page.selectOption('select', 'pac_2')
    await page.fill('input[placeholder*="dolor de garganta"]', 'dolor de garganta')
    await page.getByRole('button', { name: /Comenzar a escuchar/ }).click()
    await page.waitForSelector('.rec-timer')
    await page.waitForTimeout(8000)
    await page.getByRole('button', { name: 'Terminar consulta' }).click()

    await page.waitForSelector('text=Nota generada automáticamente', { timeout: 30000 })
    await page.screenshot({ path: `${OUT}/backend-${nombre}-nota.png` })

    const texto = await page.locator('body').innerText()
    // En una nota sin firmar los campos son editables, así que su contenido vive
    // en el value de los controles y no en el texto renderizado.
    const valores = await page.evaluate(() =>
      [...document.querySelectorAll('input, textarea')]
        .map((el) => el.value)
        .join('\n'),
    )
    check(valores.includes(MARCA_DX), `[${nombre}] la nota mostrada viene del backend`)
    check(texto.includes(MARCA_ALERTA), `[${nombre}] se muestra la alerta previa a la firma`)
    check(!texto.includes('Nota de demostración'), `[${nombre}] no cayó al modo demostración`)

    await ctx.close()
  }
} finally {
  await browser.close()
  detener(web); detener(noa); falso.close()
  // Restaura la build sin backend, que es la que usan las demás pruebas.
  execSync('npm run build', { stdio: 'ignore' })
}

for (const e of errores) fallos.push(`error de consola: ${e}`)
if (fallos.length) {
  console.error(`\n${fallos.length} fallo(s):`)
  for (const f of fallos) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log('\nintegración con backend verificada en móvil y escritorio ✓')
