import { env } from './env'

/**
 * Registro seguro para datos de salud. Nunca imprime transcripciones ni notas a
 * menos que se active explícitamente NOA_LOG_CLINICAL, y recorta cualquier texto
 * libre que llegue por accidente.
 */

const marca = () => new Date().toISOString()

export function info(evento: string, datos: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ t: marca(), nivel: 'info', evento, ...datos }))
}

export function warn(evento: string, datos: Record<string, unknown> = {}): void {
  console.warn(JSON.stringify({ t: marca(), nivel: 'warn', evento, ...datos }))
}

/**
 * Los mensajes de error de la API pueden traer fragmentos del prompt, así que se
 * truncan salvo que el registro clínico esté habilitado.
 */
export function error(evento: string, e: unknown, datos: Record<string, unknown> = {}): void {
  const bruto = e instanceof Error ? e.message : String(e)
  const mensaje = env.logClinico ? bruto : bruto.slice(0, 200)
  console.error(
    JSON.stringify({
      t: marca(),
      nivel: 'error',
      evento,
      error: mensaje,
      tipo: e instanceof Error ? e.constructor.name : typeof e,
      ...datos,
    }),
  )
}
