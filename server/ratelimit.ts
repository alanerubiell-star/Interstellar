import type { NextFunction, Request, Response } from 'express'
import { env } from './env'

/**
 * Límite por IP en memoria: suficiente para un consultorio o un despliegue de
 * una sola instancia. Con varias réplicas hay que moverlo a Redis.
 */
const ventanas = new Map<string, { conteo: number; expira: number }>()

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const ahora = Date.now()
  const clave = req.ip ?? 'desconocida'
  const actual = ventanas.get(clave)

  if (!actual || actual.expira <= ahora) {
    ventanas.set(clave, { conteo: 1, expira: ahora + env.limiteVentanaMs })
    next()
    return
  }

  if (actual.conteo >= env.limitePeticiones) {
    res
      .status(429)
      .set('Retry-After', String(Math.ceil((actual.expira - ahora) / 1000)))
      .json({ error: 'demasiadas_peticiones', mensaje: 'Demasiadas consultas seguidas. Espera un momento.' })
    return
  }

  actual.conteo++
  next()
}

/** Purga periódica para que el mapa no crezca sin límite. */
setInterval(() => {
  const ahora = Date.now()
  for (const [k, v] of ventanas) if (v.expira <= ahora) ventanas.delete(k)
}, 60_000).unref()
