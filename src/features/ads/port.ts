import type { ComponentType } from 'react';

/** O banner avisa uma vez: carregou, ou falhou (sem preenchimento, sem rede, qualquer erro). */
export interface BannerProps {
  onLoaded: () => void;
  onFailed: (reason: string) => void;
}

/**
 * Anúncio do app (E08 C): o SDK do Google no aparelho; nada na web nem nos testes de tela.
 * Tudo aqui pode falhar sem afetar o uso: quem chama trata falha como "sem anúncio".
 */
export interface AdsPort {
  /** Consentimento e início do SDK. true: pode pedir anúncio. */
  start: () => Promise<boolean>;
  /** O mercado exige um caminho para rever a escolha de consentimento (Europa, Reino Unido). */
  privacyRequired: () => Promise<boolean>;
  showPrivacy: () => Promise<void>;
  Banner: ComponentType<BannerProps> | null;
}

/** Sem anúncio: a web (D124) e qualquer tela testada sem provedor. */
export const noAds: AdsPort = {
  start: () => Promise.resolve(false),
  privacyRequired: () => Promise.resolve(false),
  showPrivacy: () => Promise.resolve(),
  Banner: null,
};
