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
