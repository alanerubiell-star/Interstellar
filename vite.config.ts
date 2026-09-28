import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * El backend suele vivir en otro origen que la app empaquetada, así que su origen
 * debe entrar en connect-src o el navegador bloquea la llamada. Se deriva de
 * VITE_NOA_API en tiempo de build; sin esa variable la app habla con su propio
 * origen (proxy de desarrollo) y basta 'self'.
 */
function origenApi(): string {
  const bruto = process.env.VITE_NOA_API?.trim()
  if (!bruto) return ''
  try {
    return new URL(bruto).origin
  } catch {
    throw new Error(`VITE_NOA_API no es una URL válida: "${bruto}"`)
  }
}

function csp(): string {
  const api = origenApi()
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",   // estilos en línea de React
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${api ? ` ${api}` : ''}`,
    "media-src 'self' blob: mediastream:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    // frame-ancestors sólo aplica por cabecera HTTP: se configura en el servidor,
    // no aquí (el navegador ignora la directiva si llega por <meta>).
  ].join('; ')
}

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
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp()}" />`,
      )
    },
  }
}

export default defineConfig({
  plugins: [react(), cspEnProduccion()],
  base: './',
  server: {
    host: true,
    port: 5173,
    // En desarrollo el front habla con el backend por el mismo origen; en la
    // build empaquetada se usa VITE_NOA_API (ver src/lib/api.ts).
    proxy: {
      '/api': {
        target: process.env.NOA_API_TARGET ?? 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
})
