import type { TranscriptLine } from '../src/lib/types'

/**
 * Punto de conexión de voz a texto.
 *
 * Hoy la transcripción se produce en el dispositivo (Web Speech API, ver
 * `src/lib/speech.ts`) y llega ya en texto: no requiere proveedor externo, no
 * saca el audio de la sesión y funciona sin costo adicional.
 *
 * Para transcripción del lado del servidor (Whisper, Deepgram, AssemblyAI, un
 * modelo propio) basta implementar esta interfaz y registrarla abajo. Anthropic
 * no ofrece voz a texto, así que ese proveedor es una decisión aparte — y para
 * datos de pacientes reales exige convenio de tratamiento de datos.
 */
export interface Transcriptor {
  readonly nombre: string
  transcribir(audio: Buffer, tipoMime: string): Promise<TranscriptLine[]>
}

class SinTranscriptorServidor implements Transcriptor {
  readonly nombre = 'cliente (Web Speech API)'

  async transcribir(): Promise<TranscriptLine[]> {
    throw new Error(
      'No hay transcriptor de servidor configurado: la transcripción llega desde el cliente.',
    )
  }
}

let activo: Transcriptor = new SinTranscriptorServidor()

export const registrarTranscriptor = (t: Transcriptor): void => {
  activo = t
}
export const transcriptor = (): Transcriptor => activo
