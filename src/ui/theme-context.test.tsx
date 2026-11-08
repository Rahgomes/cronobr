import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import { themeColors, type Colors } from './theme';
import { ThemeProvider, useColors, useColorSchemeInUse, useThemedStyles } from './theme-context';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(() => 'dark'),
}));

const make = jest.fn((colors: Colors) => StyleSheet.create({ box: { color: colors.primary } }));

function Probe() {
  const colors = useColors();
  const styles = useThemedStyles(make);
  return (
    <Text testID="probe" style={styles.box}>
      {useColorSchemeInUse()} {colors.background}
    </Text>
  );
}

// O app sempre monta o ThemeProvider (automático cai no escuro); o claro fora dele serve aos testes do kit.
it('fora do provider usa o claro', async () => {
  await render(<Probe />);
  expect(screen.getByTestId('probe')).toHaveTextContent(`light ${themeColors('light').background}`);
});

it('automático segue o celular e a folha é criada uma vez por tema', async () => {
  make.mockClear();
  await render(
    <ThemeProvider mode="auto">
      <Probe />
      <Probe />
    </ThemeProvider>,
  );
  const dark = themeColors('dark');
  expect(screen.getAllByTestId('probe')[0]).toHaveTextContent(`dark ${dark.background}`);
  expect(screen.getAllByTestId('probe')[0]).toHaveStyle({ color: dark.primary });
  expect(make).toHaveBeenCalledTimes(1);
});

it('modo fixo ignora o celular', async () => {
  await render(
    <ThemeProvider mode="light">
      <Probe />
    </ThemeProvider>,
  );
  expect(screen.getByTestId('probe')).toHaveTextContent(`light ${themeColors('light').background}`);
});
