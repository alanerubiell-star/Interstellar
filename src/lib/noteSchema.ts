import { z } from 'zod'

/**
 * Fuente única de verdad de la nota clínica: el servidor la usa como esquema de
 * salida estructurada para Claude y el cliente deriva de aquí sus tipos, de modo
 * que backend y frontend no puedan divergir.
 *
 * Las descripciones no son documentación: viajan en el esquema JSON que recibe el
 * modelo y son parte del prompt.
 */

export const SignosVitalesSchema = z.object({
  ta: z.string().describe('Tensión arterial en mmHg, formato "120/80". Cadena vacía si no se menciona.'),
  fc: z.string().describe('Frecuencia cardiaca en latidos por minuto. Cadena vacía si no se menciona.'),
  fr: z.string().describe('Frecuencia respiratoria en respiraciones por minuto. Cadena vacía si no se menciona.'),
  temp: z.string().describe('Temperatura corporal en grados Celsius. Cadena vacía si no se menciona.'),
  sato2: z.string().describe('Saturación de oxígeno en porcentaje. Cadena vacía si no se menciona.'),
  peso: z.string().describe('Peso en kilogramos. Cadena vacía si no se menciona.'),
  talla: z.string().describe('Talla en metros, formato "1.70". Cadena vacía si no se menciona.'),
})

export const DiagnosticoSchema = z.object({
  cie10: z.string().describe('Clave CIE-10 (ej. "J03.9"). Cadena vacía si no hay una clave clara.'),
  texto: z.string().describe('Nombre del diagnóstico según la CIE-10.'),
})

export const MedicamentoSchema = z.object({
  farmaco: z.string().describe('Fármaco y presentación, ej. "Amoxicilina 500 mg".'),
  dosis: z.string().describe('Cantidad por toma, ej. "1 cápsula".'),
  via: z.string().describe('Vía de administración, ej. "Oral".'),
  frecuencia: z.string().describe('Intervalo, ej. "Cada 8 horas".'),
  duracion: z.string().describe('Duración del tratamiento, ej. "7 días".'),
})

export const ClinicalNoteSchema = z.object({
  motivo: z
    .string()
    .describe('Motivo de consulta en una frase, con terminología médica.'),
  padecimientoActual: z
    .string()
    .describe(
      'Padecimiento actual en prosa médica: evolución, características, síntomas asociados y negativos relevantes. Sólo lo que aparezca en la transcripción.',
    ),
  exploracionFisica: z
    .string()
    .describe(
      'Hallazgos de la exploración física en prosa médica, únicamente los explorados o descritos en voz alta. Cadena vacía si no se exploró nada.',
    ),
  signosVitales: SignosVitalesSchema,
  diagnosticos: z
    .array(DiagnosticoSchema)
    .describe('Diagnósticos sustentados por la consulta, del principal al secundario.'),
  plan: z
    .array(z.string())
    .describe('Plan de estudio y tratamiento: razonamiento clínico, estudios solicitados, tratamiento y seguimiento.'),
  indicaciones: z
    .array(z.string())
    .describe('Indicaciones dirigidas al paciente, en lenguaje llano, incluyendo datos de alarma.'),
  receta: z
    .array(MedicamentoSchema)
    .describe('Medicamentos indicados en la consulta. Arreglo vacío si no se recetó nada.'),
  pronostico: z.string().describe('Pronóstico para la vida y la función.'),
})

/** Metadatos que el modelo devuelve junto a la nota, para revisión del médico. */
export const NoteReviewSchema = z.object({
  confianza: z
    .enum(['alta', 'media', 'baja'])
    .describe('Qué tan completa y clara fue la consulta para documentarla.'),
  alertas: z
    .array(z.string())
    .describe(
      'Puntos que el médico debe verificar antes de firmar: datos faltantes, dosis a confirmar, interacciones o alergias en conflicto. Arreglo vacío si no hay nada que señalar.',
    ),
})

export const NoteResponseSchema = z.object({
  note: ClinicalNoteSchema,
  revision: NoteReviewSchema,
})

export type SignosVitales = z.infer<typeof SignosVitalesSchema>
export type Diagnostico = z.infer<typeof DiagnosticoSchema>
export type Medicamento = z.infer<typeof MedicamentoSchema>
export type ClinicalNote = z.infer<typeof ClinicalNoteSchema>
export type NoteReview = z.infer<typeof NoteReviewSchema>
export type NoteResponse = z.infer<typeof NoteResponseSchema>
