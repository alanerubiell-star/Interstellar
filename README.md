# Noa Notes

Asistente de IA que escucha la consulta y escribe la nota clínica.
Una sola base de código para **móvil** y **escritorio**.

> Construido a partir de la lámina de marca de Noa Notes (Doctoralia): paleta,
> tipografía, marca y los seis beneficios de producto se reproducen en la app.

---

## Qué hace

| Pantalla | Contenido |
|---|---|
| **Portada** | La lámina de marca convertida en onboarding: propuesta de valor y los 6 beneficios. |
| **Consultas** | Métricas del día, buscador y lista de consultas agrupadas en *Hoy* / *Anteriores*. |
| **Grabación** | Cronómetro, onda de audio en vivo y transcripción con separación médico/paciente. |
| **Generación** | Progreso por etapas: transcripción → hallazgos → redacción → verificación. |
| **Nota clínica** | Nota editable con la estructura de la NOM-004-SSA3-2012, receta, firma, copia y descarga. |
| **Pacientes** | Alta, búsqueda, alergias, antecedentes e historial por paciente. |
| **Métricas** | Consultas por semana, estado de las notas y tiempo de escritura ahorrado. |
| **Ajustes** | Perfil profesional, estilo de nota, privacidad e integraciones. |

La nota se genera con la estructura de la **nota de consulta de la NOM-004-SSA3-2012**:
motivo, padecimiento actual, signos vitales, exploración física, diagnósticos con
CIE-10, plan, indicaciones al paciente, receta y pronóstico.

---

## Cómo correrlo

```bash
npm install
npm run dev          # http://localhost:5173
```

### Escritorio (Electron — macOS, Windows, Linux)

```bash
npm run desktop      # compila y abre la app de escritorio
npm run desktop:dev  # abre Electron contra el servidor de desarrollo
```

### Móvil (Capacitor — iOS y Android)

```bash
npx cap add ios          # una sola vez (requiere Xcode)
npx cap add android      # una sola vez (requiere Android Studio)

npm run mobile:ios
npm run mobile:android
```

Hay que declarar el permiso de micrófono en cada plataforma:
`NSMicrophoneUsageDescription` en `Info.plist` (iOS) y `RECORD_AUDIO` en
`AndroidManifest.xml` (Android).

### Web / PWA

`npm run build` produce una PWA instalable (manifest + service worker), con el
App Shell en caché para que abra sin conexión.

### Prueba de humo

```bash
npm run smoke
# CHROMIUM_PATH=/ruta/a/chromium npm run smoke   # si Playwright no trae navegador
```

Recorre la app completa en un viewport móvil (390×844) y uno de escritorio
(1440×900): portada, grabación, generación, firma, pacientes, métricas y ajustes.
Falla ante cualquier error de consola, desbordamiento horizontal, transcripción
detenida o nota firmada que siga siendo editable. Deja capturas en `.smoke/`.

---

## Arquitectura

```
src/
  lib/         dominio: tipos, formato, motor de notas, guiones clínicos, micrófono
  state/       store en React Context con persistencia en localStorage
  components/  marco responsivo, iconos, onda de audio, primitivas de UI
  screens/     una pantalla por ruta
  styles/      tokens de marca + hoja global + estilos de la app
electron/      contenedor de escritorio
scripts/       prueba de humo end-to-end
```

**Un solo layout responsivo**, sin rutas duplicadas: `AppShell` cambia de riel
lateral (≥900 px) a barra inferior con botón central de grabación (<900 px).
Se usa `HashRouter` para que la misma build sirva en web, PWA instalada y
`file://` dentro de Electron.

### Dónde se conecta la IA real

Toda la generación pasa por una sola función:

```ts
// src/lib/engine.ts
generateNote(motivo, transcript, onEtapa): Promise<ClinicalNote>
```

En esta versión devuelve notas desde guiones clínicos locales
(`src/lib/cases.ts`) y simula el progreso por etapas. Para conectar el backend
real basta sustituir el cuerpo de esa función conservando la firma y el callback
de progreso; la UI no cambia. La captura de micrófono en `src/lib/useRecorder.ts`
ya es real (Web Audio + `getUserMedia`) y el nivel que alimenta la onda proviene
del audio del dispositivo.

---

## Estado y pendientes

Esta es una **versión de producto navegable y verificada**, todavía no apta para
uso clínico real. Antes de tocar datos de pacientes reales falta:

- **Backend**: transcripción y LLM sobre un servicio propio, con cifrado en
  tránsito y en reposo. Hoy todo vive en `localStorage` del dispositivo.
- **Cuentas y autenticación**: no hay login; la app asume un solo médico.
- **Aviso de privacidad y consentimiento** conforme a la LFPDPPP, con registro
  del consentimiento del paciente antes de grabar.
- **Firma electrónica avanzada** con validez legal (hoy la firma es un cambio de
  estado, no una firma criptográfica).
- **Bitácora de auditoría** de accesos y cambios sobre el expediente.
- **Exportación a PDF** y conexión al expediente electrónico del consultorio.

### Sobre COFEPRIS

El siguiente paso mencionado —replicar el modelo de Eleonor con permisos de
COFEPRIS— **no está incluido en esta entrega** y es trabajo regulatorio, no sólo
de software. Un asistente que sugiere diagnóstico o tratamiento puede clasificar
como software como dispositivo médico y requerir registro sanitario ante
COFEPRIS; el alcance exacto y la clase de riesgo los tiene que determinar un
asesor regulatorio sobre el uso previsto final. Lo que la app ya trae para ese
camino: estructura de nota conforme a la NOM-004, campos de cédula profesional y
firma del médico, y la nota siempre editable y revisable por la persona médica
antes de firmar.
