/* Contenedor de escritorio de Noa Notes (macOS, Windows, Linux). */
const { app, BrowserWindow, shell, systemPreferences } = require('electron')
const path = require('node:path')

const DEV_URL = process.env.NOA_DEV_URL // p. ej. http://localhost:5173

function crearVentana() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 380,          // el mismo layout responsivo sirve al reducir la ventana
    minHeight: 560,
    backgroundColor: '#FBFBFD',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: path.join(__dirname, '..', 'public', 'icon-512.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (DEV_URL) {
    win.loadURL(DEV_URL)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  // Los enlaces externos salen al navegador, no abren ventanas de Electron.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return win
}

app.whenReady().then(async () => {
  // En macOS el permiso de micrófono se solicita al proceso, no a la página.
  if (process.platform === 'darwin') {
    try {
      await systemPreferences.askForMediaAccess('microphone')
    } catch {
      /* el usuario puede concederlo después desde Preferencias del Sistema */
    }
  }

  crearVentana()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
