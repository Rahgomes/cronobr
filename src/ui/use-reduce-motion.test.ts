import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { reduceMotionNow, useReduceMotion } from './use-reduce-motion';

afterEach(() => {
  jest.restoreAllMocks();
});

it.each([true, false])('segue o aparelho (reduzir = %s)', async (value) => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(value);
  const { result } = await renderHook(() => useReduceMotion());
  expect(result.current).toBe(value);
});

it('começa sem animação e acompanha a troca', async () => {
  let listener: (value: boolean) => void = () => undefined;
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockReturnValue(new Promise(() => undefined));
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_, fn) => {
    listener = fn;
    return { remove: jest.fn() };
  });
  const { result } = await renderHook(() => useReduceMotion());
  expect(result.current).toBe(true);
  await act(() => {
    listener(false);
  });
  expect(result.current).toBe(false);
});

it('reduceMotionNow: sem animação até o aparelho responder', async () => {
  let listener: (value: boolean) => void = () => undefined;
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_, fn) => {
    listener = fn;
    return { remove: jest.fn() };
  });
  // Primeira chamada do arquivo: a escuta começa aqui.
  expect(reduceMotionNow()).toBe(true);
  await act(async () => {
    await Promise.resolve();
  });
  expect(reduceMotionNow()).toBe(false);
  listener(true);
  expect(reduceMotionNow()).toBe(true);
});
