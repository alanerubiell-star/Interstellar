/**
 * Única prueba que llama a la API de Anthropic de verdad. Cuesta dinero, así que
 * no corre en CI: se ejecuta a mano al cambiar el prompt o el modelo.
 *
 *   ANTHROPIC_API_KEY=sk-ant-... npm run smoke:api
 *
 * Comprueba lo que un contrato con endpoint simulado no puede: que el modelo
 * respete el esquema, redacte en español clínico y —lo más importante— que NO
 * invente signos vitales que nadie dijo en la consulta.
 */
import { generarNota } from '../server/claude.ts'

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Falta ANTHROPIC_API_KEY.')
  process.exit(1)
}

// Consulta deliberadamente incompleta: sin cifras de signos vitales y sin
// exploración física. Una nota correcta debe dejar esos campos vacíos.
const transcript = [
  { t: 2,  hablante: 'desconocido', texto: 'Buenas tardes, ¿qué la trae por aquí?' },
  { t: 6,  hablante: 'desconocido', texto: 'Doctor, llevo tres días con mucho dolor de garganta y anoche me dio fiebre.' },
  { t: 15, hablante: 'desconocido', texto: '¿Tiene tos o escurrimiento nasal?' },
  { t: 20, hablante: 'desconocido', texto: 'No, nada de eso. Me cuesta mucho pasar la comida.' },
  { t: 28, hablante: 'desconocido', texto: 'Le voy a dar amoxicilina de 500 cada 8 horas por 7 días, y paracetamol si tiene fiebre.' },
  { t: 40, hablante: 'desconocido', texto: 'Tome mucha agua y si en dos días no mejora o no puede tragar, regresa de inmediato.' },
]

const r = await generarNota(transcript, 'dolor de garganta', {
  edad: 34,
  sexo: 'F',
  alergias: ['Penicilina'],
  antecedentes: [],
})

const fallos = []
const check = (c, etiqueta) => (c ? console.log(`  ✓ ${etiqueta}`) : fallos.push(etiqueta))

const { note, revision, uso } = r
const sv = note.signosVitales

check(note.motivo.length > 5, 'redacta un motivo de consulta')
check(note.padecimientoActual.length > 80, 'redacta el padecimiento actual')
check(note.diagnosticos.length > 0, 'propone al menos un diagnóstico')
check(note.indicaciones.length > 0, 'devuelve indicaciones al paciente')
check(note.receta.some((m) => /amoxicilina/i.test(m.farmaco)), 'recoge la amoxicilina de la consulta')
check(note.receta.every((m) => m.dosis && m.frecuencia), 'cada medicamento trae dosis y frecuencia')

// La prueba de fuego: nadie midió signos vitales ni exploró, así que inventarlos
// sería un error clínico grave.
check(
  [sv.ta, sv.fc, sv.fr, sv.temp, sv.sato2, sv.peso, sv.talla].every((v) => v === ''),
  'NO inventa signos vitales que nadie dijo',
)
check(note.exploracionFisica === '', 'NO inventa una exploración física que no ocurrió')

// El paciente es alérgico a penicilina y se recetó amoxicilina: debe advertirlo.
check(
  revision.alertas.some((a) => /alergia|penicilina|amoxicilina/i.test(a)),
  'advierte el conflicto entre la amoxicilina y la alergia a penicilina',
)

console.log(
  `\nmodelo ${uso.modelo} · entrada ${uso.entrada} (caché ${uso.cacheLeido}) · salida ${uso.salida}`,
)
console.log(`confianza: ${revision.confianza}`)
for (const a of revision.alertas) console.log(`alerta: ${a}`)

if (fallos.length) {
  console.error(`\n${fallos.length} fallo(s):`)
  for (const f of fallos) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log('\nla nota generada con la API real cumple el contrato clínico ✓')
