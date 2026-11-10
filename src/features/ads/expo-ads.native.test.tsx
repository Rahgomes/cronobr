import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  AdsConsentStatus,
} from 'react-native-google-mobile-ads';

import * as sdk from '@/test/ads-sdk-mock';

import { createAdsPort } from './expo-ads.native';

const consent = jest.mocked(AdsConsent);

/** Resposta do consentimento com a revisão de privacidade exigida (Europa, Reino Unido). */
const info = (canRequestAds: boolean) => ({
  canRequestAds,
  status: AdsConsentStatus.OBTAINED,
  isConsentFormAvailable: true,
  privacyOptionsRequirementStatus: AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
});

afterEach(() => {
  jest.clearAllMocks();
  sdk.banners.length = 0;
});

describe('porta de anúncio no aparelho', () => {
  it('consentimento, depois classificação livre e início do SDK; uma vez só', async () => {
    const port = createAdsPort();
    await expect(port.start()).resolves.toBe(true);
    await expect(port.start()).resolves.toBe(true);
    expect(consent.gatherConsent).toHaveBeenCalledTimes(1);
    expect(sdk.setRequestConfiguration).toHaveBeenCalledWith({ maxAdContentRating: 'PG' });
    expect(sdk.initialize).toHaveBeenCalledTimes(1);
  });

  it('formulário falhou (sem rede): vale o consentimento guardado', async () => {
    consent.gatherConsent.mockRejectedValueOnce(new Error('offline'));
    await expect(createAdsPort().start()).resolves.toBe(true);
    expect(sdk.initialize).toHaveBeenCalled();
  });

  it('sem consentimento: não inicia o SDK e tenta de novo na próxima vez', async () => {
    consent.getConsentInfo.mockResolvedValueOnce(info(false));
    const port = createAdsPort();
    await expect(port.start()).resolves.toBe(false);
    expect(sdk.initialize).not.toHaveBeenCalled();
    await expect(port.start()).resolves.toBe(true);
    expect(consent.gatherConsent).toHaveBeenCalledTimes(2);
  });

  it('SDK falhou ao iniciar: sem anúncio, sem erro para cima', async () => {
    sdk.initialize.mockRejectedValueOnce(new Error('sdk'));
    await expect(createAdsPort().start()).resolves.toBe(false);
  });

  it('privacidade: link só quando o mercado exige; erro conta como não exige', async () => {
    const port = createAdsPort();
    await expect(port.privacyRequired()).resolves.toBe(false);
    consent.getConsentInfo.mockResolvedValueOnce(info(true));
    await expect(port.privacyRequired()).resolves.toBe(true);
    consent.getConsentInfo.mockRejectedValueOnce(new Error('x'));
    await expect(port.privacyRequired()).resolves.toBe(false);
    consent.showPrivacyOptionsForm.mockRejectedValueOnce(new Error('x'));
    await expect(port.showPrivacy()).resolves.toBeUndefined();
    await expect(port.showPrivacy()).resolves.toBeUndefined();
  });

  it('banner: bloco de teste do Google, em linha e baixo; avisa carga e falha com o motivo', async () => {
    const { Banner } = createAdsPort();
    if (!Banner) throw new Error('sem banner');
    const onLoaded = jest.fn();
    const onFailed = jest.fn();
    await render(<Banner onLoaded={onLoaded} onFailed={onFailed} />);
    const props = sdk.banners.at(-1) as {
      unitId: string;
      size: string;
      maxHeight: number;
      onAdLoaded: () => void;
      onAdFailedToLoad: (e: { reason?: string }) => void;
    };
    expect(props.unitId).toBe('ca-app-pub-3940256099942544/2435281174');
    expect(props.size).toBe('INLINE_ADAPTIVE_BANNER');
    expect(props.maxHeight).toBe(100);
    props.onAdLoaded();
    expect(onLoaded).toHaveBeenCalled();
    props.onAdFailedToLoad({ reason: 'no-fill' });
    props.onAdFailedToLoad({});
    expect(onFailed.mock.calls).toEqual([['no-fill'], ['unknown']]);
  });

  it('iPhone: ao voltar para a frente, pede o banner de novo; Android não', async () => {
    const { Banner } = createAdsPort();
    if (!Banner) throw new Error('sem banner');
    await render(<Banner onLoaded={jest.fn()} onFailed={jest.fn()} />);
    sdk.foreground.run?.();
    expect(sdk.bannerLoad).toHaveBeenCalledTimes(Platform.OS === 'ios' ? 1 : 0);
    const os = Platform.OS;
    Platform.OS = os === 'ios' ? 'android' : 'ios';
    sdk.bannerLoad.mockClear();
    sdk.foreground.run?.();
    expect(sdk.bannerLoad).toHaveBeenCalledTimes(Platform.OS === 'ios' ? 1 : 0);
    Platform.OS = os;
  });
});
