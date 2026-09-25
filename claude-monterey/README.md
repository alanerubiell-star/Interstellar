# Claude para macOS Monterey (12.x)

Una app nativa y ligera (Swift + WebKit, ~150 KB) que abre **claude.ai en su propia ventana**, con icono en el Dock, sesión guardada, atajos de teclado, subida y descarga de archivos y micrófono para dictado.

> No es la app oficial de Anthropic. Es una ventana nativa que carga claude.ai, así que no incluye las funciones exclusivas de Claude Desktop (MCP local, Cowork, Computer Use ni el atajo global).

## Instalación (5 minutos)

1. **Actualiza Safari** a la última versión para Monterey (Preferencias del Sistema → Actualización de software). La app usa el motor de Safari.
2. **Instala las herramientas de compilación** (una sola vez). Abre Terminal y ejecuta:
   ```bash
   xcode-select --install
   ```
3. **Descarga este repositorio** (botón verde *Code → Download ZIP* en GitHub) y descomprímelo, o clónalo:
   ```bash
   git clone -b claude/nifty-noether-wm6xqo https://github.com/alanerubiell-star/Interstellar.git
   ```
4. **Compila e instala:**
   ```bash
   cd Interstellar/claude-monterey
   ./build.sh --install
   ```
   Se crea `/Applications/Claude Monterey.app` y se abre sola. Para dejarla en el Dock: clic derecho en el icono → Opciones → Mantener en el Dock.

## Atajos

| Atajo | Acción |
|---|---|
| ⌘N | Nuevo chat |
| ⌘R | Recargar |
| ⌘[ / ⌘] | Atrás / Adelante |
| ⌘= / ⌘- / ⌘0 | Zoom + / − / normal |
| ⌃⌘F | Pantalla completa |
| ⌘W | Cerrar ventana (clic en el Dock para reabrirla) |

## Qué funciona

- La sesión se guarda: solo inicias sesión una vez.
- Arrastrar archivos o usar el botón de adjuntar.
- Las descargas (artefactos, archivos) se guardan en `~/Downloads`.
- Los enlaces externos se abren en tu navegador predeterminado.
- Micrófono para el dictado por voz (macOS pedirá permiso la primera vez).

## Problemas comunes

- **Google no deja iniciar sesión** ("este navegador no es seguro"): en la pantalla de login usa **"Continuar con correo"** con el mismo Gmail; te llega un código o enlace y listo.
- **"No se puede abrir porque es de un desarrollador no identificado"**: no debería pasar si la compilas tú, pero si pasa: clic derecho en la app → Abrir → Abrir.
- **Actualizar la app**: no hace falta; siempre carga la versión actual de claude.ai.

## Alternativas sin compilar nada

1. **Google Chrome o Microsoft Edge como app** (siguen siendo compatibles con Monterey):
   abre `claude.ai`, luego menú ⋮ → *Transmitir, guardar y compartir* → **Instalar página como app…** (en Edge: *Aplicaciones → Instalar este sitio como una aplicación*).
   Queda una app "Claude" en `~/Applications/Chrome Apps`, con ventana propia e icono en el Dock. El login con Google funciona sin problemas.
2. **Descarga directa de la app oficial** (el enlace puede cambiar; si falla, usa claude.ai/download):
   `https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect`.
   Según el centro de ayuda de Anthropic, el requisito mínimo es macOS 11 Big Sur, pero si al abrirla macOS dice que necesita una versión más reciente, usa una de las opciones de arriba.
3. **Claude Code** (en la terminal, para programar), que funciona en macOS 10.15 o superior:
   ```bash
   curl -fsSL https://claude.ai/install.sh | bash
   ```
