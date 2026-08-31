import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",   // estilos en línea de React
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self' blob: mediastream:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  // frame-ancestors sólo aplica por cabecera HTTP: se configura en el servidor,
  // no aquí (el navegador ignora la directiva si llega por <meta>).
].join('; ')

/**
 * Inserta la CSP sólo en la build: en desarrollo rompería el cliente HMR de Vite,
 * que inyecta scripts en línea.
 */
function cspEnProduccion(): Plugin {
  return {
    name: 'noa-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), cspEnProduccion()],
  base: './',
  server: { host: true, port: 5173 },
})
