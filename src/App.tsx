import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider, useStore } from './state/store'
import { Home } from './screens/Home'
import { Record } from './screens/Record'
import { NoteDetail } from './screens/NoteDetail'
import { Patients } from './screens/Patients'
import { PatientDetail } from './screens/PatientDetail'
import { Metrics } from './screens/Metrics'
import { Settings } from './screens/Settings'
import { Onboarding } from './screens/Onboarding'

/** La portada sólo se impone la primera vez; después es accesible desde Ajustes. */
function Inicio() {
  const { onboardingVisto } = useStore()
  return onboardingVisto ? <Home /> : <Navigate to="/bienvenida" replace />
}

export default function App() {
  return (
    <StoreProvider>
      {/* HashRouter: la misma build sirve para web, PWA instalada y contenedor de escritorio. */}
      <HashRouter>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/bienvenida" element={<Onboarding />} />
          <Route path="/consulta/nueva" element={<Record />} />
          <Route path="/consulta/:id" element={<NoteDetail />} />
          <Route path="/pacientes" element={<Patients />} />
          <Route path="/pacientes/:id" element={<PatientDetail />} />
          <Route path="/metricas" element={<Metrics />} />
          <Route path="/ajustes" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
