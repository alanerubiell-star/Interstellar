import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { NoteResponseSchema, type NoteResponse } from '../src/lib/noteSchema'
import { construirMensaje, SISTEMA, type ContextoPaciente } from './prompt'
import type { TranscriptLine } from '../src/lib/types'
import { env } from './env'
import * as log from './log'

/** El SDK lee ANTHROPIC_API_KEY del entorno; se pasa explícito para fallar claro si falta. */
const client = new Anthropic({ apiKey: env.apiKey })

export class ErrorGeneracion extends Error {
  constructor(
    readonly codigo: 'sin_credenciales' | 'rechazo' | 'limite' | 'upstream' | 'sin_parseo',
    readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje)
  }
}

export interface ResultadoNota extends NoteResponse {
  uso: {
    entrada: number
    salida: number
    cacheLeido: number
    cacheEscrito: number
    modelo: string
  }
}

export async function generarNota(
  transcript: TranscriptLine[],
  motivo: string,
  paciente?: ContextoPaciente,
): Promise<ResultadoNota> {
  if (!env.apiKey) {
    throw new ErrorGeneracion(
      'sin_credenciales',
      503,
      'El servidor no tiene ANTHROPIC_API_KEY configurada.',
    )
  }

  const inicio = Date.now()

  try {
    const respuesta = await client.beta.messages.parse({
      model: env.modelo,
      max_tokens: env.maxTokens,

      // Los clasificadores de Opus 5 pueden declinar contenido clínico
      // (fármacos, autolesión, toxicología). Con fallbacks la petición se
      // reintenta sola en otro modelo en vez de dejar al médico sin nota.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',

      // Prompt de sistema estable y cacheado: entre consultas sólo cambia el
      // mensaje del usuario, así que el prefijo se sirve desde caché.
      system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],

      thinking: { type: 'adaptive' },
      output_config: {
        effort: env.effort,
        format: zodOutputFormat(NoteResponseSchema),
      },

      messages: [{ role: 'user', content: construirMensaje(transcript, motivo, paciente) }],
    })

    // En un rechazo la respuesta llega con HTTP 200 y sin contenido utilizable:
    // hay que mirar stop_reason antes que content.
    if (respuesta.stop_reason === 'refusal') {
      log.warn('generacion_rechazada', {
        categoria: respuesta.stop_details?.category ?? null,
      })
      throw new ErrorGeneracion(
        'rechazo',
        422,
        'El modelo declinó procesar esta consulta. Documenta la nota manualmente y repórtalo.',
      )
    }

    if (!respuesta.parsed_output) {
      throw new ErrorGeneracion(
        'sin_parseo',
        502,
        'La nota generada no cumplió el esquema esperado.',
      )
    }

    const uso = {
      entrada: respuesta.usage.input_tokens,
      salida: respuesta.usage.output_tokens,
      cacheLeido: respuesta.usage.cache_read_input_tokens ?? 0,
      cacheEscrito: respuesta.usage.cache_creation_input_tokens ?? 0,
      modelo: respuesta.model,
    }

    log.info('nota_generada', {
      ms: Date.now() - inicio,
      lineas: transcript.length,
      ...uso,
      alertas: respuesta.parsed_output.revision.alertas.length,
      confianza: respuesta.parsed_output.revision.confianza,
    })

    return { ...respuesta.parsed_output, uso }
  } catch (e) {
    if (e instanceof ErrorGeneracion) throw e

    if (e instanceof Anthropic.RateLimitError) {
      log.error('limite_upstream', e)
      throw new ErrorGeneracion('limite', 429, 'El servicio está saturado. Intenta de nuevo en un momento.')
    }
    if (e instanceof Anthropic.AuthenticationError) {
      log.error('credenciales_invalidas', e)
      throw new ErrorGeneracion('sin_credenciales', 503, 'Credenciales del servicio inválidas.')
    }
    if (e instanceof Anthropic.APIError) {
      log.error('error_api', e, { estado: e.status })
      throw new ErrorGeneracion('upstream', 502, 'El servicio de generación no está disponible.')
    }

    log.error('error_inesperado', e)
    throw new ErrorGeneracion('upstream', 502, 'No se pudo generar la nota.')
  }
}
