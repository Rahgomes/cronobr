import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InsideTabsContext, ListScreen, Screen } from './screen';
import { Text } from './text';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: jest.fn(({ children }: { children: ReactNode }) => children),
}));

it.each([
  [false, ['top', 'bottom', 'left', 'right']],
  [true, ['top', 'left', 'right']],
])('dentro das abas=%s respeita as bordas %j', async (insideTabs, edges) => {
  await render(
    <InsideTabsContext.Provider value={insideTabs}>
      <Screen>
        <Text>Conteúdo</Text>
      </Screen>
    </InsideTabsContext.Provider>,
  );
  expect(screen.getByText('Conteúdo')).toBeOnTheScreen();
  expect(jest.mocked(SafeAreaView).mock.lastCall?.[0]).toMatchObject({ edges });
});

it('lista longa renderiza só a primeira janela (PRD 23 PF5)', async () => {
  const data = Array.from({ length: 300 }, (_, i) => `Cliente ${i}`);
  await render(
    <ListScreen
      header={<Text>Cabeçalho</Text>}
      data={data}
      keyExtractor={(item) => item}
      renderItem={({ item }) => <Text>{item}</Text>}
    />,
  );
  expect(screen.getByText('Cabeçalho')).toBeOnTheScreen();
  expect(screen.getByText('Cliente 0')).toBeOnTheScreen();
  expect(screen.queryByText('Cliente 299')).toBeNull();
  expect(screen.getAllByText(/^Cliente \d+$/).length).toBeLessThanOrEqual(20);
});

it.each([
  [false, 640],
  [true, 1080],
])('wide=%s limita a largura do conteúdo e do rodapé a %i (tablet)', async (wide, max) => {
  await render(
    <Screen wide={wide} footer={<Text>Rodapé</Text>}>
      <Text>Conteúdo</Text>
    </Screen>,
  );
  expect(screen.getByText('Rodapé').parent).toHaveStyle({ maxWidth: max, alignSelf: 'center' });
});
