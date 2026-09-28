import express, { type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { env, validarEntorno } from './env'
import { ErrorGeneracion, generarNota } from './claude'
import { transcriptor } from './transcribe'
import { rateLimit } from './ratelimit'
import * as log from './log'

const app = express()
app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(express.json({ limit: '2mb' }))

/** CORS acotado. La app de escritorio carga desde file:// y llega sin Origin. */
app.use((req: Request, res: Response, next: NextFunction) => {
  const origen = req.headers.origin
  if (origen && env.origenes.includes(origen)) {
    res.set('Access-Control-Allow-Origin', origen)
    res.set('Vary', 'Origin')
  }
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

const LineaSchema = z.object({
  t: z.number().min(0),
  hablante: z.enum(['medico', 'paciente', 'desconocido']),
  texto: z.string().min(1).max(env.maxCaracteresLinea),
})

const PeticionNota = z.object({
  motivo: z.string().max(500).default(''),
  transcript: z.array(LineaSchema).min(1).max(env.maxLineasTranscripcion),
  paciente: z
    .object({
      edad: z.number().int().min(0).max(130).optional(),
      sexo: z.enum(['F', 'M', 'X']).optional(),
      alergias: z.array(z.string().max(120)).max(40).optional(),
      antecedentes: z.array(z.string().max(240)).max(40).optional(),
    })
    .optional(),
})

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    modelo: env.modelo,
    effort: env.effort,
    credenciales: Boolean(env.apiKey),
    transcriptorServidor: transcriptor().nombre,
  })
})

app.post('/api/note', rateLimit, async (req: Request, res: Response) => {
  const parseo = PeticionNota.safeParse(req.body)
  if (!parseo.success) {
    res.status(400).json({
      error: 'peticion_invalida',
      // Sólo las rutas de los campos: los valores son datos clínicos.
      mensaje: 'La consulta enviada no tiene el formato esperado.',
      campos: parseo.error.issues.map((i) => i.path.join('.')),
    })
    return
  }

  const { motivo, transcript, paciente } = parseo.data

  try {
    const resultado = await generarNota(transcript, motivo, paciente)
    res.json(resultado)
  } catch (e) {
    if (e instanceof ErrorGeneracion) {
      res.status(e.estado).json({ error: e.codigo, mensaje: e.message })
      return
    }
    log.error('fallo_ruta_note', e)
    res.status(500).json({ error: 'interno', mensaje: 'No se pudo generar la nota.' })
  }
})

app.use((_req, res) => {
  res.status(404).json({ error: 'no_encontrado' })
})

const servidor = app.listen(env.puerto, () => {
  for (const p of validarEntorno()) log.warn('config', { aviso: p })
  log.info('servidor_listo', {
    puerto: env.puerto,
    modelo: env.modelo,
    effort: env.effort,
    credenciales: Boolean(env.apiKey),
  })
})

for (const senal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(senal, () => {
    log.info('apagando', { senal })
    servidor.close(() => process.exit(0))
  })
}
