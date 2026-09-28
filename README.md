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
cp .env.example .env          # y pon tu ANTHROPIC_API_KEY

npm run server                # backend en :8787
npm run dev                   # front en :5173 (hace proxy de /api)
```

Sin `ANTHROPIC_API_KEY` la app arranca igual y funciona en **modo demostración**:
las notas salen de guiones clínicos locales y la pantalla lo dice explícitamente.

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
  lib/         dominio: tipos, esquema de la nota, cliente del backend, micrófono, voz
  state/       store en React Context con persistencia en localStorage
  components/  marco responsivo, iconos, onda de audio, primitivas de UI
  screens/     una pantalla por ruta
  styles/      tokens de marca + hoja global + estilos de la app
server/        backend: generación de la nota con Claude
electron/      contenedor de escritorio
scripts/       pruebas de contrato, integración y humo
```

**Un solo layout responsivo**, sin rutas duplicadas: `AppShell` cambia de riel
lateral (≥900 px) a barra inferior con botón central de grabación (<900 px).
Se usa `HashRouter` para que la misma build sirva en web, PWA instalada y
`file://` dentro de Electron.

### El backend

```
server/
  index.ts       rutas HTTP, CORS, validación de entrada, límite de peticiones
  claude.ts      cliente de Anthropic y generación de la nota
  prompt.ts      prompt de sistema clínico y armado del mensaje
  transcribe.ts  punto de conexión para un STT de servidor
  env.ts         configuración y validación de arranque
  log.ts         registro que nunca imprime contenido clínico
```

`POST /api/note` recibe la transcripción y el contexto del paciente y devuelve la
nota más una revisión. `GET /api/health` reporta modelo y credenciales.

**Generación.** Claude Opus 5 con pensamiento adaptativo y **salida estructurada**:
el esquema de `src/lib/noteSchema.ts` viaja como contrato, así que la respuesta
siempre parsea y el front no adivina formas. Ese mismo archivo es de donde el
cliente deriva sus tipos, de modo que backend y frontend no pueden divergir.

**Revisión antes de firmar.** Junto a la nota el modelo devuelve `confianza` y
`alertas`: medicamentos que chocan con una alergia del expediente, dosis que no
quedaron claras en el audio, diagnósticos sin sustento. Se muestran en la nota y
sólo desaparecen al firmarla.

**No inventar.** La instrucción central del prompt es que un dato inventado en un
expediente es un error clínico grave: si un signo vital no se dijo en voz alta, el
campo queda vacío en vez de estimarse; si no hubo exploración física, no se
redacta una normal genérica. `npm run smoke:api` verifica justamente eso contra la
API real.

**Costo.** El prompt de sistema va marcado con `cache_control`, así que entre
consultas sólo se paga el diálogo nuevo. El servidor registra
`cacheLeido`/`cacheEscrito` por petición para poder vigilarlo. `NOA_EFFORT` permite
barrer niveles de esfuerzo: Opus 5 rinde bien en `low` y `medium`, pero conviene
medirlo con evaluación clínica propia antes de bajarlo.

**Resiliencia.** Los clasificadores de seguridad pueden declinar contenido clínico
(fármacos, toxicología, autolesión). Se envía `fallbacks: "default"`, que reintenta
la petición en otro modelo del lado del servidor en vez de dejar al médico sin
nota. Si el modelo aun así declina, la app lo dice en lugar de inventar.

### Transcripción

La transcripción es **real y ocurre en el dispositivo** con la Web Speech API
(`src/lib/speech.ts`), en `es-MX`. No requiere proveedor externo ni costo
adicional.

Tiene un límite: **no separa hablantes.** Las frases llegan marcadas como
`desconocido` y el modelo deduce por el contenido quién habla. Funciona bien —
quien pregunta y explora es el médico — pero no es diarización de verdad.

Para diarización real hace falta un STT de servidor. Anthropic no ofrece voz a
texto, así que ese proveedor (Whisper, Deepgram, AssemblyAI o uno propio) es una
**decisión aparte**, y con pacientes reales exige convenio de tratamiento de
datos. El hueco ya está hecho: implementar la interfaz `Transcriptor` de
`server/transcribe.ts` y registrarla.

---

## Pruebas

| Comando | Qué hace | Cuesta dinero |
|---|---|---|
| `npm run typecheck` | Tipos de cliente y servidor | no |
| `npm run contract` | Suplanta la API de Anthropic y verifica la petición saliente (modelo, betas, `fallbacks`, esquema, caché), la validación de entrada, el límite de peticiones y el caso sin credenciales | no |
| `npm run smoke` | La app completa en móvil y escritorio, sin backend: comprueba que avise que la nota es de demostración | no |
| `npm run smoke:backend` | Igual pero con backend: comprueba que lo que se pinta venga del servidor y que salga el panel de alertas | no |
| `npm run smoke:api` | **Llama a la API real.** Verifica que el modelo respete el esquema y que no invente signos vitales ni exploraciones | **sí** |

Las cuatro primeras corren sin credenciales y son las que deberían estar en CI.

---

## Estado y pendientes

Esta es una **versión de producto navegable y verificada**, todavía no apta para
uso clínico real. Antes de tocar datos de pacientes reales falta:

- **Persistencia en servidor**: el backend genera notas pero no las guarda; el
  expediente sigue viviendo en `localStorage` del dispositivo. Falta base de
  datos con cifrado en reposo y respaldo.
- **Cuentas y autenticación**: no hay login ni autorización; `/api/note` está
  abierto a cualquiera que alcance el servidor. Sólo hay límite por IP.
- **HTTPS y cabeceras**: desplegar tras TLS y fijar `frame-ancestors` por
  cabecera HTTP (por `<meta>` el navegador la ignora).
- **Diarización**: separar médico y paciente requiere un STT de servidor.
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
