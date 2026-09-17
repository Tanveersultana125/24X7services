import type { CapacitorConfig } from '@capacitor/cli'
import { brand } from './config/brand'

/**
 * How the static export becomes an Android app.
 *
 * Capacitor takes `out/` — the same build the web gets — and serves it inside a
 * WebView. That is why `next.config.ts` rules out anything needing a Node
 * server, and why `trailingSlash` is on: under `file://` there is nothing to
 * fall back from `/home` to `/home/index.html`, so the export has to emit the
 * directory form.
 *
 * DECISION NEEDED: `appId` has to match the Play Console package before the
 * first upload and can never change afterwards. It is read from config/brand so
 * there is one place to change it, and that place is marked too.
 */
const config: CapacitorConfig = {
  appId: brand.androidAppId,
  appName: brand.fullName,
  webDir: 'out',

  android: {
    // The bundle is local, so nothing needs cleartext to reach it. Firebase,
    // Razorpay and Maps are all HTTPS.
    allowMixedContent: false,
  },

  server: {
    // `https` rather than `file` for the WebView origin: a file:// origin has
    // no storage partition worth the name, and Firebase Auth, Firestore
    // persistence and localStorage all depend on having one.
    androidScheme: 'https',
  },

  plugins: {
    /**
     * The splash is the native one, shown while the WebView boots. The app's
     * own splash screen takes over from it, so this hides as soon as the web
     * layer is up rather than on a timer — two splash screens in sequence, one
     * of them waiting out a countdown, is how a fast app feels slow.
     */
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: '#0a0a0a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
}

export default config
