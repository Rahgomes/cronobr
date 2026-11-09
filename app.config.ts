import type { ExpoConfig } from 'expo/config';

// Projeto EAS próprio do CronôBR na conta rahgomes (nunca o do ManiVez).
const EAS_PROJECT_ID = '800a228d-1c5a-4086-ae71-04b104faf449';

// Arquivo .cronobr (E05, docs/spec/formato-cronobr.md): JSON com extensão própria. O iPhone
// precisa do tipo declarado para oferecer "Abrir no CronôBR"; o Android recebe pelo filtro de
// intenção (WhatsApp e Downloads costumam mandar como octet-stream ou json).
const CRONOBR_UTI = 'com.cronobr.app.arquivo';

const config: ExpoConfig = {
  name: 'CronôBR',
  slug: 'cronobr',
  owner: 'rahgomes',
  version: '2.0.0',
  scheme: 'cronobr',
  // Gira (E06 C): a sessão usa a paisagem em duas colunas; as outras telas rolam e centralizam.
  orientation: 'default',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  ios: {
    bundleIdentifier: 'com.cronobr.app',
    supportsTablet: true,
    // Aviso de troca de fase fura o modo Foco (finalidade legítima de timer, E03).
    entitlements: { 'com.apple.developer.usernotifications.time-sensitive': true },
    infoPlist: {
      UTExportedTypeDeclarations: [
        {
          UTTypeIdentifier: CRONOBR_UTI,
          UTTypeDescription: 'Arquivo do CronôBR',
          UTTypeConformsTo: ['public.json', 'public.data'],
          UTTypeTagSpecification: {
            'public.filename-extension': ['cronobr'],
            'public.mime-type': ['application/vnd.cronobr+json'],
          },
        },
      ],
      CFBundleDocumentTypes: [
        {
          CFBundleTypeName: 'Arquivo do CronôBR',
          CFBundleTypeRole: 'Viewer',
          LSHandlerRank: 'Owner',
          LSItemContentTypes: [CRONOBR_UTI],
        },
      ],
      // O sistema entrega uma cópia (Inbox): o app nunca guarda caminho do aparelho de origem.
      LSSupportsOpeningDocumentsInPlace: false,
    },
  },
  android: {
    package: 'com.cronobr.app',
    adaptiveIcon: {
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
      backgroundColor: '#FF6B35',
    },
    // Timer é função principal do app: a política da Play permite USE_EXACT_ALARM (concedida
    // na instalação). Sem ela, o Android pode atrasar o aviso de troca de fase em minutos.
    permissions: ['android.permission.USE_EXACT_ALARM'],
    intentFilters: [
      {
        action: 'VIEW',
        category: ['DEFAULT', 'BROWSABLE'],
        data: [
          { scheme: 'content', mimeType: 'application/vnd.cronobr+json' },
          { scheme: 'content', mimeType: 'application/json' },
          { scheme: 'content', mimeType: 'application/octet-stream' },
          { scheme: 'file', mimeType: '*/*', pathPattern: '.*\\.cronobr' },
        ],
      },
    ],
  },
  web: { output: 'single', favicon: './assets/images/favicon.png', bundler: 'metro' },
  plugins: [
    'expo-router',
    // Idiomas do app: o aparelho oferece a troca por app (Android 13+, iOS) entre estes.
    ['expo-localization', { supportedLocales: ['pt-BR', 'en', 'es', 'fr'] }],
    ['expo-audio', { microphonePermission: false }],
    // Metrônomo pelo relógio de áudio (E07 B). Só com o app à vista: sem serviço em primeiro
    // plano, sem permissão extra e sem áudio em segundo plano (os padrões do plugin ligam tudo).
    [
      'react-native-audio-api',
      {
        iosBackgroundMode: false,
        androidForegroundService: false,
        androidPermissions: [],
      },
    ],
    [
      'expo-notifications',
      {
        // Os mesmos .wav do app tocam nas notificações (iOS até 30 s; Android por canal).
        sounds: ['beepShort', 'beepLong', 'bell', 'gong', 'whistle', 'finish'].map(
          (name) => `./assets/sounds/${name}.wav`,
        ),
      },
    ],
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
