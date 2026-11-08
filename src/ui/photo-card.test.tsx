import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text, type NativeScrollEvent } from 'react-native';

import { Carousel, carouselIndex } from './carousel';
import { FADE_SOLID_AT, PhotoBadge, PhotoCard, PhotoFade } from './photo-card';

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

it('degradê de leitura: chega à faixa de 78% antes da metade do card', async () => {
  await render(<PhotoFade />);
  expect(FADE_SOLID_AT).toBeLessThanOrEqual(0.5);
});

describe('posição no carrossel', () => {
  const at = (x: number) =>
    ({
      contentOffset: { x, y: 0 },
      contentSize: { width: 1000, height: 100 },
      layoutMeasurement: { width: 390, height: 100 },
    }) as NativeScrollEvent;

  it('arredonda para o card mais perto e segura nas pontas', () => {
    expect(carouselIndex(at(0), 228, 5)).toBe(0);
    expect(carouselIndex(at(120), 228, 5)).toBe(1);
    expect(carouselIndex(at(-30), 228, 5)).toBe(0);
  });

  it('no fim da rolagem marca o último, mesmo sem ele encostar na borda', () => {
    expect(carouselIndex(at(610), 228, 5)).toBe(4);
  });
});

it('carrossel: os pontos acompanham a rolagem e somem com um card só', async () => {
  await render(
    <Carousel title="Modalidades" itemWidth={200}>
      <Text>a</Text>
      <Text>b</Text>
    </Carousel>,
  );
  expect(
    screen.getByTestId('carousel-dots', { includeHiddenElements: true }).children,
  ).toHaveLength(2);
  await fireEvent.scroll(screen.getByTestId('carousel-scroll'), {
    nativeEvent: {
      contentOffset: { x: 400, y: 0 },
      contentSize: { width: 600, height: 100 },
      layoutMeasurement: { width: 200, height: 100 },
    },
  });
  const [first, second] = screen.getByTestId('carousel-dots', {
    includeHiddenElements: true,
  }).children;
  expect(second).toHaveStyle({ width: 18 });
  expect(first).toHaveStyle({ width: 6 });
  await render(
    <Carousel title="Recentes" itemWidth={200}>
      <Text>a</Text>
    </Carousel>,
  );
  expect(screen.queryByTestId('carousel-dots', { includeHiddenElements: true })).toBeNull();
});
