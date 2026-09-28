import { CASES } from './cases'
import type { Consultation, Doctor, Patient, Preferencias } from './types'

const hoy = new Date()
const hace = (dias: number, hora = 10, min = 0): string => {
  const d = new Date(hoy)
  d.setDate(d.getDate() - dias)
  d.setHours(hora, min, 0, 0)
  return d.toISOString()
}

export const seedDoctor: Doctor = {
  nombre: 'Dra. Mariana Herrera',
  especialidad: 'Medicina Interna',
  cedula: '7845213',
  institucion: 'Clínica Santa Fe',
  consultorio: 'Consultorio 402, Torre B',
}

export const seedPreferencias: Preferencias = {
  estiloNota: 'soap',
  autoFirmar: false,
  incluirReceta: true,
  retenerAudio: false,
  idioma: 'es-MX',
}

export const seedPatients: Patient[] = [
  {
    id: 'pac_1', nombre: 'Laura Jiménez Ruiz', fechaNacimiento: '1991-04-18', sexo: 'F',
    telefono: '55 1234 5678', email: 'laura.jimenez@correo.mx', expediente: 'EXP-0241',
    alergias: [], antecedentes: ['Rinitis alérgica'], createdAt: hace(420),
  },
  {
    id: 'pac_2', nombre: 'Roberto Salinas Mora', fechaNacimiento: '1968-11-02', sexo: 'M',
    telefono: '55 2233 8890', email: 'r.salinas@correo.mx', expediente: 'EXP-0118',
    alergias: ['Penicilina'], antecedentes: ['Hipertensión arterial', 'Tabaquismo suspendido (2015)'],
    createdAt: hace(900),
  },
  {
    id: 'pac_3', nombre: 'Andrés Castillo Vega', fechaNacimiento: '1985-07-25', sexo: 'M',
    telefono: '55 8765 1122', expediente: 'EXP-0392',
    alergias: [], antecedentes: ['Lumbalgia recurrente'], createdAt: hace(210),
  },
  {
    id: 'pac_4', nombre: 'Guadalupe Ortega Pineda', fechaNacimiento: '1959-01-30', sexo: 'F',
    telefono: '55 4455 7788', email: 'lupita.ortega@correo.mx', expediente: 'EXP-0075',
    alergias: ['Sulfas'], antecedentes: ['Diabetes mellitus tipo 2', 'Dislipidemia'], createdAt: hace(1200),
  },
  {
    id: 'pac_5', nombre: 'Sofía Bermúdez Lara', fechaNacimiento: '1998-09-12', sexo: 'F',
    telefono: '55 9090 3131', expediente: 'EXP-0455',
    alergias: [], antecedentes: [], createdAt: hace(40),
  },
]

const caso = (id: string) => CASES.find((c) => c.id === id)!

export const seedConsultations: Consultation[] = [
  {
    id: 'con_1', patientId: 'pac_2', fecha: hace(0, 9, 15), duracionSeg: 118, estado: 'firmada',
    motivo: caso('hipertension').motivo, transcript: caso('hipertension').transcript,
    note: caso('hipertension').note,
    firmadaPor: seedDoctor.nombre, firmadaEn: hace(0, 9, 22),
  },
  {
    id: 'con_2', patientId: 'pac_1', fecha: hace(0, 11, 40), duracionSeg: 131, estado: 'borrador',
    motivo: caso('faringoamigdalitis').motivo, transcript: caso('faringoamigdalitis').transcript,
    note: caso('faringoamigdalitis').note,
  },
  {
    id: 'con_3', patientId: 'pac_4', fecha: hace(2, 16, 5), duracionSeg: 110, estado: 'firmada',
    motivo: caso('control-diabetes').motivo, transcript: caso('control-diabetes').transcript,
    note: caso('control-diabetes').note,
    firmadaPor: seedDoctor.nombre, firmadaEn: hace(2, 16, 14),
  },
  {
    id: 'con_4', patientId: 'pac_3', fecha: hace(5, 13, 30), duracionSeg: 124, estado: 'firmada',
    motivo: caso('lumbalgia').motivo, transcript: caso('lumbalgia').transcript,
    note: caso('lumbalgia').note,
    firmadaPor: seedDoctor.nombre, firmadaEn: hace(5, 13, 41),
  },
  {
    id: 'con_5', patientId: 'pac_5', fecha: hace(9, 10, 20), duracionSeg: 129, estado: 'firmada',
    motivo: caso('faringoamigdalitis').motivo, transcript: caso('faringoamigdalitis').transcript,
    note: caso('faringoamigdalitis').note,
    firmadaPor: seedDoctor.nombre, firmadaEn: hace(9, 10, 31),
  },
  {
    id: 'con_6', patientId: 'pac_2', fecha: hace(12, 17, 0), duracionSeg: 115, estado: 'firmada',
    motivo: caso('hipertension').motivo, transcript: caso('hipertension').transcript,
    note: caso('hipertension').note,
    firmadaPor: seedDoctor.nombre, firmadaEn: hace(12, 17, 9),
  },
  {
    id: 'con_7', patientId: 'pac_4', fecha: hace(16, 11, 45), duracionSeg: 108, estado: 'firmada',
    motivo: caso('control-diabetes').motivo, transcript: caso('control-diabetes').transcript,
    note: caso('control-diabetes').note,
    firmadaPor: seedDoctor.nombre, firmadaEn: hace(16, 11, 55),
  },
  {
    id: 'con_8', patientId: 'pac_3', fecha: hace(19, 15, 10), duracionSeg: 121, estado: 'firmada',
    motivo: caso('lumbalgia').motivo, transcript: caso('lumbalgia').transcript,
    note: caso('lumbalgia').note,
    firmadaPor: seedDoctor.nombre, firmadaEn: hace(19, 15, 22),
  },
  {
    id: 'con_9', patientId: 'pac_1', fecha: hace(24, 9, 40), duracionSeg: 134, estado: 'firmada',
    motivo: caso('faringoamigdalitis').motivo, transcript: caso('faringoamigdalitis').transcript,
    note: caso('faringoamigdalitis').note,
    firmadaPor: seedDoctor.nombre, firmadaEn: hace(24, 9, 52),
  },
]
