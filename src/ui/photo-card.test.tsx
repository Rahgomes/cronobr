import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Carousel } from './carousel';
import { PhotoBadge, PhotoCard } from './photo-card';

it('card com foto: um botão só para o leitor de tela, foto escondida, título e selo', async () => {
  const onPress = jest.fn();
  await render(
    <PhotoCard
      photo={1}
      width={160}
      height={200}
      title="Tabata"
      subtitle="20 s forte"
      badge={<PhotoBadge label="2 modelos" />}
      accessibilityLabel="Tabata: 20 s forte, 2 modelos"
      onPress={onPress}
    />,
  );
  expect(screen.getByText('Tabata')).toBeOnTheScreen();
  expect(screen.getByText('20 s forte')).toBeOnTheScreen();
  expect(screen.getByText('2 modelos')).toBeOnTheScreen();
  expect(screen.queryByRole('image')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Tabata: 20 s forte, 2 modelos' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('sem foto e sem subtítulo continua um card legível', async () => {
  await render(
    <PhotoCard
      photo={null}
      width="48%"
      height={120}
      title="Corrida"
      accessibilityLabel="Corrida"
      onPress={jest.fn()}
    />,
  );
  expect(screen.getByRole('button', { name: 'Corrida' })).toBeOnTheScreen();
});

it('carrossel: título de seção e "ver todos" opcional', async () => {
  const onPress = jest.fn();
  const { rerender } = await render(
    <Carousel title="Recentes" itemWidth={150} seeAll={{ label: 'Ver histórico', onPress }}>
      <Text>card</Text>
    </Carousel>,
  );
  expect(screen.getByRole('header', { name: 'Recentes' })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Ver histórico' }));
  expect(onPress).toHaveBeenCalledTimes(1);
  await rerender(
    <Carousel title="Recentes" itemWidth={150}>
      <Text>card</Text>
    </Carousel>,
  );
  expect(screen.queryByRole('button')).toBeNull();
});
