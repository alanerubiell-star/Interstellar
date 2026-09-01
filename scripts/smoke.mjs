/**
 * Prueba de humo end-to-end: recorre la app completa en un viewport móvil y uno
 * de escritorio, y falla si aparece un error de consola, un error de página o
 * desbordamiento horizontal.
 *
 *   npm run smoke              # guarda capturas en .smoke/
 *   npm run smoke -- --keep    # además deja el servidor de preview corriendo
 *
 * Requiere: npm run build (se ejecuta solo) y un Chromium de Playwright.
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { setTimeout as espera } from 'node:timers/promises'

const PUERTO = 4173
const BASE = `http://127.0.0.1:${PUERTO}`
const OUT = '.smoke'
const EJECUTABLE = process.env.CHROMIUM_PATH // p. ej. /opt/pw-browsers/chromium

mkdirSync(OUT, { recursive: true })

const preview = spawn(
  'npx',
  ['vite', 'preview', '--port', String(PUERTO), '--host', '127.0.0.1'],
  { stdio: 'ignore' },
)
const cerrarPreview = () => preview.kill()
process.on('exit', cerrarPreview)

// espera a que el preview responda
for (let i = 0; i < 40; i++) {
  try {
    const r = await fetch(BASE)
    if (r.ok) break
  } catch { /* aún no levanta */ }
  await espera(250)
}

const errores = []
const browser = await chromium.launch({
  ...(EJECUTABLE ? { executablePath: EJECUTABLE } : {}),
  args: ['--no-sandbox'],
})

async function recorrido(nombre, viewport, isMobile) {
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, locale: 'es-MX' })
  const page = await ctx.newPage()
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    // Esta corrida es justo el escenario sin backend: el sondeo a /api/health
    // falla a propósito y el navegador lo registra. No es un error de la app.
    if ((m.location()?.url ?? '').includes('/api/health')) return
    errores.push(`[${nombre}] ${m.text()}`)
  })
  page.on('pageerror', (e) => errores.push(`[${nombre}] ${e.message}`))

  const captura = (n) => page.screenshot({ path: `${OUT}/${nombre}-${n}.png` })

  // portada
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Menos escritura')
  await captura('1-portada')

  // inicio
  await page.getByRole('button', { name: 'Comenzar' }).click()
  await page.waitForSelector('text=Consultas hoy')
  await captura('2-inicio')

  // nota existente + transcripción
  await page.locator('.cons-card').first().click()
  await page.waitForSelector('text=Padecimiento actual')
  await captura('3-nota')
  await page.getByRole('tab', { name: 'Transcripción' }).click()
  await page.waitForSelector('.linea')

  // grabación completa → generación → nota nueva → firma
  await page.goto(`${BASE}/#/consulta/nueva`, { waitUntil: 'networkidle' })
  await page.selectOption('select', { index: 1 })
  await page.fill('input[placeholder*="dolor de garganta"]', 'dolor de garganta')
  await page.getByRole('button', { name: /Comenzar a escuchar/ }).click()
  await page.waitForSelector('.rec-timer')
  await page.waitForTimeout(9000)
  const lineas = await page.locator('.rec-transcript .linea').count()
  if (lineas === 0) errores.push(`[${nombre}] la transcripción no avanzó`)
  await captura('4-grabando')

  await page.getByRole('button', { name: 'Terminar consulta' }).click()
  await page.waitForSelector('text=Noa está escribiendo la nota')
  await page.waitForSelector('text=Nota generada automáticamente', { timeout: 20000 })
  // Sin backend la nota debe venir del guion local, y decirlo.
  const cuerpo = await page.locator('body').innerText()
  if (!cuerpo.includes('Nota de demostración')) {
    errores.push(`[${nombre}] sin backend no se avisó que la nota es de demostración`)
  }
  await captura('5-nota-generada')

  await page.getByRole('button', { name: 'Firmar nota' }).click()
  await page.waitForSelector('text=Nota firmada por')
  const editables = await page.locator('.textarea').count()
  if (editables > 0) errores.push(`[${nombre}] la nota firmada sigue siendo editable`)
  await captura('6-nota-firmada')

  // resto de secciones
  for (const [ruta, ancla, n] of [
    ['/#/pacientes', '.cons-card', '7-pacientes'],
    ['/#/metricas', '.barras', '8-metricas'],
    ['/#/ajustes', 'text=Perfil profesional', '9-ajustes'],
  ]) {
    await page.goto(BASE + ruta, { waitUntil: 'networkidle' })
    await page.waitForSelector(ancla)
    await captura(n)
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  if (overflow > 0) errores.push(`[${nombre}] desbordamiento horizontal de ${overflow}px`)

  await ctx.close()
  return { lineas, overflow }
}

const movil = await recorrido('movil', { width: 390, height: 844 }, true)
const escritorio = await recorrido('escritorio', { width: 1440, height: 900 }, false)
await browser.close()

if (!process.argv.includes('--keep')) cerrarPreview()

console.log(`móvil       transcripción=${movil.lineas} líneas · overflow=${movil.overflow}px`)
console.log(`escritorio  transcripción=${escritorio.lineas} líneas · overflow=${escritorio.overflow}px`)
console.log(`capturas    ${OUT}/`)

if (errores.length) {
  console.error(`\n${errores.length} problema(s):`)
  for (const e of errores) console.error('  ' + e)
  process.exit(1)
}
console.log('\nsin errores de consola, sin desbordamiento, nota firmada bloqueada ✓')
