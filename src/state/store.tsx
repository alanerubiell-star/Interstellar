import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react'
import { uid } from '../lib/id'
import { load, save, clearAll } from '../lib/storage'
import { seedConsultations, seedDoctor, seedPatients, seedPreferencias } from '../lib/seed'
import type { Consultation, Doctor, Patient, Preferencias } from '../lib/types'

interface Store {
  doctor: Doctor
  preferencias: Preferencias
  patients: Patient[]
  consultations: Consultation[]
  onboardingVisto: boolean

  setDoctor: (d: Doctor) => void
  setPreferencias: (p: Preferencias) => void
  addPatient: (p: Omit<Patient, 'id' | 'createdAt'>) => Patient
  updatePatient: (id: string, cambios: Partial<Patient>) => void
  addConsultation: (c: Omit<Consultation, 'id'>) => Consultation
  updateConsultation: (id: string, cambios: Partial<Consultation>) => void
  deleteConsultation: (id: string) => void
  completarOnboarding: () => void
  restablecerDemo: () => void

  patientById: (id: string) => Patient | undefined
  consultationById: (id: string) => Consultation | undefined
  consultationsOf: (patientId: string) => Consultation[]
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [doctor, setDoctorState] = useState<Doctor>(() => load('doctor', seedDoctor))
  const [preferencias, setPrefsState] = useState<Preferencias>(() =>
    load('preferencias', seedPreferencias),
  )
  const [patients, setPatients] = useState<Patient[]>(() => load('patients', seedPatients))
  const [consultations, setConsultations] = useState<Consultation[]>(() =>
    load('consultations', seedConsultations),
  )
  const [onboardingVisto, setOnboardingVisto] = useState<boolean>(() =>
    load('onboardingVisto', false),
  )

  useEffect(() => save('doctor', doctor), [doctor])
  useEffect(() => save('preferencias', preferencias), [preferencias])
  useEffect(() => save('patients', patients), [patients])
  useEffect(() => save('consultations', consultations), [consultations])
  useEffect(() => save('onboardingVisto', onboardingVisto), [onboardingVisto])

  const addPatient = useCallback((p: Omit<Patient, 'id' | 'createdAt'>) => {
    const nuevo: Patient = { ...p, id: uid('pac'), createdAt: new Date().toISOString() }
    setPatients((prev) => [nuevo, ...prev])
    return nuevo
  }, [])

  const updatePatient = useCallback((id: string, cambios: Partial<Patient>) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)))
  }, [])

  const addConsultation = useCallback((c: Omit<Consultation, 'id'>) => {
    const nueva: Consultation = { ...c, id: uid('con') }
    setConsultations((prev) => [nueva, ...prev])
    return nueva
  }, [])

  const updateConsultation = useCallback((id: string, cambios: Partial<Consultation>) => {
    setConsultations((prev) => prev.map((c) => (c.id === id ? { ...c, ...cambios } : c)))
  }, [])

  const deleteConsultation = useCallback((id: string) => {
    setConsultations((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const restablecerDemo = useCallback(() => {
    clearAll()
    setDoctorState(seedDoctor)
    setPrefsState(seedPreferencias)
    setPatients(seedPatients)
    setConsultations(seedConsultations)
    setOnboardingVisto(false)
  }, [])

  const value = useMemo<Store>(
    () => ({
      doctor, preferencias, patients, consultations, onboardingVisto,
      setDoctor: setDoctorState,
      setPreferencias: setPrefsState,
      addPatient, updatePatient, addConsultation, updateConsultation, deleteConsultation,
      completarOnboarding: () => setOnboardingVisto(true),
      restablecerDemo,
      patientById: (id) => patients.find((p) => p.id === id),
      consultationById: (id) => consultations.find((c) => c.id === id),
      consultationsOf: (patientId) =>
        consultations
          .filter((c) => c.patientId === patientId)
          .sort((a, b) => +new Date(b.fecha) - +new Date(a.fecha)),
    }),
    [
      doctor, preferencias, patients, consultations, onboardingVisto,
      addPatient, updatePatient, addConsultation, updateConsultation, deleteConsultation,
      restablecerDemo,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>')
  return ctx
}
