import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'br.com.fisionotes.app',
  appName: 'Fisionotes',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    scheme: 'Fisionotes',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#07241E',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#07241E',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
}

export default config
