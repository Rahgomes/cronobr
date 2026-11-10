import { useRef } from 'react';
import { Platform } from 'react-native';
import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  BannerAd,
  BannerAdSize,
  MaxAdContentRating,
  TestIds,
  useForeground,
} from 'react-native-google-mobile-ads';

import type { AdsPort, BannerProps } from './port';

/**
 * Só o bloco de teste público do Google nesta etapa (D125): nenhum anúncio real, nenhuma conta.
 * Trocar pelo bloco da conta é decisão de lançamento, junto com o ID do app no app.config.ts.
 */
const UNIT_ID = TestIds.ADAPTIVE_BANNER;
/** Discreto: no máximo a altura de um banner grande de celular. */
const MAX_HEIGHT = 100;

/**
 * Consentimento pela plataforma do Google (UMP) a cada abertura, como a documentação pede; se
 * falhar (sem rede), vale o da vez anterior. Classificação livre (PG): app de treino para todos.
 */
async function begin(): Promise<boolean> {
  try {
    await AdsConsent.gatherConsent();
  } catch {
    // Sem rede ou formulário indisponível: segue com o consentimento já guardado.
  }
  const { canRequestAds } = await AdsConsent.getConsentInfo();
  if (!canRequestAds) return false;
  await mobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.PG });
  await mobileAds().initialize();
  return true;
}

function Banner({ onLoaded, onFailed }: BannerProps) {
  const ref = useRef<BannerAd>(null);
  // iPhone: a página do banner pode morrer com o app suspenso; pede de novo ao voltar.
  useForeground(() => {
    if (Platform.OS === 'ios') ref.current?.load();
  });
  return (
    <BannerAd
      ref={ref}
      unitId={UNIT_ID}
      // Dentro da rolagem (fim da tela), não preso à borda: adaptativo em linha, com teto baixo.
      size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
      maxHeight={MAX_HEIGHT}
      onAdLoaded={onLoaded}
      onAdFailedToLoad={(error) => {
        onFailed(error.reason ?? 'unknown');
      }}
    />
  );
}

export function createAdsPort(): AdsPort {
  let started: Promise<boolean> | null = null;
  return {
    // Sucesso fica guardado; falha deixa tentar de novo na próxima vez que a tela aparecer.
    start: () => {
      started ??= begin().then(
        (ok) => {
          if (!ok) started = null;
          return ok;
        },
        () => {
          started = null;
          return false;
        },
      );
      return started;
    },
    privacyRequired: () =>
      AdsConsent.getConsentInfo().then(
        (info) =>
          info.privacyOptionsRequirementStatus ===
          AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
        () => false,
      ),
    showPrivacy: () =>
      AdsConsent.showPrivacyOptionsForm().then(
        () => undefined,
        () => undefined,
      ),
    Banner,
  };
}
