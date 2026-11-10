// Entra no knip como entrada: as exportações substituem a lib inteira (jest.setup.ts).
// SDK de anúncio no Jest: o mínimo que expo-ads.native.tsx usa, com jest.fn para cada teste
// decidir o que o Google responde. O banner registra as props e chama de volta pelo teste.
import { createElement, forwardRef, useImperativeHandle } from 'react';

export const initialize = jest.fn(() => Promise.resolve([]));
export const setRequestConfiguration = jest.fn(() => Promise.resolve());
export default () => ({ initialize, setRequestConfiguration });

export const AdsConsent = {
  gatherConsent: jest.fn(() => Promise.resolve({ canRequestAds: true })),
  getConsentInfo: jest.fn(() =>
    Promise.resolve({ canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' }),
  ),
  showPrivacyOptionsForm: jest.fn(() => Promise.resolve({})),
};
export const AdsConsentPrivacyOptionsRequirementStatus = {
  UNKNOWN: 'UNKNOWN',
  REQUIRED: 'REQUIRED',
  NOT_REQUIRED: 'NOT_REQUIRED',
};
export const AdsConsentStatus = { OBTAINED: 'OBTAINED' };
export const MaxAdContentRating = { G: 'G', PG: 'PG', T: 'T', MA: 'MA' };
export const BannerAdSize = { INLINE_ADAPTIVE_BANNER: 'INLINE_ADAPTIVE_BANNER' };
export const TestIds = { ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/2435281174' };

/** Último "volta para a frente" registrado pelo banner (o teste chama). */
export const foreground: { run: (() => void) | null } = { run: null };
export function useForeground(fn: () => void) {
  foreground.run = fn;
}

export const bannerLoad = jest.fn();
export const banners: Record<string, unknown>[] = [];
export const BannerAd = forwardRef<{ load: () => void }, Record<string, unknown>>(
  function BannerAd(props, ref) {
    banners.push(props);
    useImperativeHandle(ref, () => ({ load: bannerLoad }));
    return createElement('BannerAd', props);
  },
);
