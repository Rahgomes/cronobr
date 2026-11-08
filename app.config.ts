import type { ExpoConfig } from 'expo/config';

// Projeto EAS próprio do CronôBR na conta rahgomes (nunca o do ManiVez).
const EAS_PROJECT_ID = '800a228d-1c5a-4086-ae71-04b104faf449';

const config: ExpoConfig = {
  name: 'CronôBR',
  slug: 'cronobr',
  owner: 'rahgomes',
  version: '2.0.0',
  scheme: 'cronobr',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  ios: { bundleIdentifier: 'com.cronobr.app', supportsTablet: true },
  android: {
    package: 'com.cronobr.app',
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
      backgroundColor: '#FF6B35',
    },
  },
  web: { output: 'single', favicon: './assets/images/favicon.png', bundler: 'metro' },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#FF6B35',
        dark: { backgroundColor: '#121212' },
      },
    ],
  ],
  // Correção pelo ar (EAS Update): canal por perfil do eas.json; runtime = versão do app.
  runtimeVersion: { policy: 'appVersion' },
  updates: { url: `https://u.expo.dev/${EAS_PROJECT_ID}` },
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: { eas: { projectId: EAS_PROJECT_ID } },
};

export default config;
