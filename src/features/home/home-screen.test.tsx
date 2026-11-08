import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/ui/theme-context';

import { HomeScreen } from './home-screen';

async function renderHome() {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider mode="dark">
        <HomeScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('Início (fundação)', () => {
  it('mostra a marca e o título', async () => {
    await renderHome();
    expect(screen.getByRole('image', { name: 'CronôBR' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Nova versão em construção' })).toBeOnTheScreen();
  });

  it('abre a sheet do que vem por aí e fecha', async () => {
    await renderHome();
    expect(screen.queryByText(/Backup em arquivo/)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'O que vem por aí' }));
    expect(screen.getByText(/Backup em arquivo entre Android e iPhone/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByText(/Backup em arquivo/)).toBeNull();
  });
});
