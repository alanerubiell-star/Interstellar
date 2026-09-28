export type Sexo = 'F' | 'M' | 'X'

export interface Patient {
  id: string
  nombre: string
  fechaNacimiento: string      // ISO date
  sexo: Sexo
  telefono?: string
  email?: string
  expediente: string           // folio interno
  alergias: string[]
  antecedentes: string[]
  createdAt: string
}

/**
 * La nota clínica y sus partes se derivan del esquema compartido con el backend
 * (`noteSchema.ts`), que es también el esquema de salida estructurada del modelo.
 * No redeclarar estas formas aquí: cambiarían sin que el servidor se entere.
 */
import type { ClinicalNote, NoteReview } from './noteSchema'

export type {
  SignosVitales,
  Diagnostico,
  Medicamento,
  ClinicalNote,
  NoteReview,
  NoteResponse,
} from './noteSchema'

export interface TranscriptLine {
  t: number                        // segundo dentro de la consulta
  /**
   * 'desconocido' cuando la transcripción viene del navegador: la Web Speech API
   * no separa hablantes. El modelo infiere quién habla por el contenido. Un STT
   * de servidor con diarización sí puede entregar la etiqueta real.
   */
  hablante: 'medico' | 'paciente' | 'desconocido'
  texto: string
}

export type EstadoConsulta = 'grabando' | 'procesando' | 'borrador' | 'firmada'

export interface Consultation {
  id: string
  patientId: string
  fecha: string                    // ISO datetime
  duracionSeg: number
  estado: EstadoConsulta
  motivo: string
  transcript: TranscriptLine[]
  note: ClinicalNote
  /** Puntos que el modelo pide verificar antes de firmar. */
  revision?: NoteReview
  /** true si la nota vino de un guion local por falta de backend. */
  demo?: boolean
  firmadaPor?: string
  firmadaEn?: string
}

export interface Doctor {
  nombre: string
  especialidad: string
  cedula: string
  institucion: string
  consultorio: string
}

export interface Preferencias {
  estiloNota: 'soap' | 'narrativa' | 'concisa'
  autoFirmar: boolean
  incluirReceta: boolean
  retenerAudio: boolean
  idioma: 'es-MX'
}
