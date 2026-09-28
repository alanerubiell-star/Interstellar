/** Configuración del servidor. Se valida al arrancar: nada de fallos a mitad de una consulta. */

const num = (v: string | undefined, def: number): number => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : def
}

export const env = {
  puerto: num(process.env.PORT, 8787),

  /** La llave nunca sale del servidor. El SDK también la toma de ANTHROPIC_API_KEY. */
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',

  modelo: process.env.NOA_MODEL ?? 'claude-opus-5',

  /**
   * Claude Opus 5 rinde muy bien en niveles bajos, pero una nota clínica es
   * sensible a la exactitud: se mantiene el default de la API ('high') y se deja
   * configurable para poder barrer niveles con evaluación propia.
   */
  effort: (process.env.NOA_EFFORT ?? 'high') as 'low' | 'medium' | 'high' | 'xhigh' | 'max',

  maxTokens: num(process.env.NOA_MAX_TOKENS, 16000),

  /** Orígenes autorizados. La app de escritorio carga desde file:// y llega sin Origin. */
  origenes: (process.env.NOA_ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  /** Tope de transcripción aceptada, para acotar costo y abuso. */
  maxLineasTranscripcion: num(process.env.NOA_MAX_TRANSCRIPT_LINES, 600),
  maxCaracteresLinea: num(process.env.NOA_MAX_LINE_CHARS, 2000),

  limiteVentanaMs: num(process.env.NOA_RATE_WINDOW_MS, 60_000),
  limitePeticiones: num(process.env.NOA_RATE_MAX, 20),

  /**
   * Registrar contenido clínico. Apagado por default y así debe quedarse en
   * producción: la transcripción y la nota son datos personales sensibles.
   */
  logClinico: process.env.NOA_LOG_CLINICAL === 'true',
}

export function validarEntorno(): string[] {
  const problemas: string[] = []
  if (!env.apiKey) {
    problemas.push(
      'Falta ANTHROPIC_API_KEY. El servidor arranca pero /api/note responderá 503.',
    )
  }
  if (env.logClinico) {
    problemas.push(
      'NOA_LOG_CLINICAL=true: se registrará contenido clínico. No usar con pacientes reales.',
    )
  }
  return problemas
}
