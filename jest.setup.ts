// Gestos: mocks do próprio gesture-handler.
import 'react-native-gesture-handler/jestSetup';

// Os testes renderizam cada tela sem a raiz do app: a checagem de "GestureDetector fora do
// GestureHandlerRootView" do modo dev fica desligada. A raiz real está em src/app/_layout.
jest.mock(
  'react-native-gesture-handler/lib/module/v3/detectors/useEnsureGestureHandlerRootView',
  () => ({
    useEnsureGestureHandlerRootView: () => undefined,
  }),
);

// Fonte dos ícones: no Jest não há registro de assets; os ícones contam como carregados.
jest.mock('expo-font', () => ({
  ...jest.requireActual<object>('expo-font'),
  isLoaded: () => true,
  loadAsync: () => Promise.resolve(),
}));

// Módulos nativos de armazenamento: o AsyncStorage tem mock oficial; o SQLite dos testes é o
// node:sqlite (src/test/node-sqlite.ts), então o expo-sqlite real nunca abre aqui.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual<object>('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

// Língua do aparelho nos testes: português (o expo-localization nativo não existe no Jest).
jest.mock('@/i18n/device', () => ({ deviceLanguageTags: () => ['pt-BR'] }));

// Relógio de áudio do metrônomo: o mock oficial da lib (os testes de tela injetam um relógio
// falso; este só garante que importar a lib não quebra).
jest.mock('react-native-audio-api', () =>
  jest.requireActual<object>('react-native-audio-api/mock'),
);
