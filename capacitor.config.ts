import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Envoltura nativa para iOS y Android.
 *   npx cap add ios      / npx cap add android   (una sola vez)
 *   npm run mobile:ios   / npm run mobile:android
 *
 * El permiso de micrófono debe declararse en cada plataforma:
 *   iOS      → NSMicrophoneUsageDescription en Info.plist
 *   Android  → android.permission.RECORD_AUDIO en AndroidManifest.xml
 */
const config: CapacitorConfig = {
  appId: 'mx.doctoralia.noanotes',
  appName: 'Noa Notes',
  webDir: 'dist',
  backgroundColor: '#FBFBFDFF',
  ios: {
    contentInset: 'always',
    backgroundColor: '#FBFBFDFF',
  },
  android: {
    backgroundColor: '#FBFBFDFF',
    allowMixedContent: false,
  },
}

export default config
