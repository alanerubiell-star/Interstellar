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

export interface SignosVitales {
  ta?: string       // tensión arterial, mmHg
  fc?: string       // frecuencia cardiaca, lpm
  fr?: string       // frecuencia respiratoria, rpm
  temp?: string     // °C
  sato2?: string    // %
  peso?: string     // kg
  talla?: string    // m
}

export interface Diagnostico {
  cie10: string
  texto: string
}

export interface Medicamento {
  farmaco: string
  dosis: string
  via: string
  frecuencia: string
  duracion: string
}

/** Estructura alineada a la nota de consulta de la NOM-004-SSA3-2012. */
export interface ClinicalNote {
  motivo: string
  padecimientoActual: string
  exploracionFisica: string
  signosVitales: SignosVitales
  diagnosticos: Diagnostico[]
  plan: string[]
  indicaciones: string[]
  receta: Medicamento[]
  pronostico: string
}

export interface TranscriptLine {
  t: number                        // segundo dentro de la consulta
  hablante: 'medico' | 'paciente'
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
