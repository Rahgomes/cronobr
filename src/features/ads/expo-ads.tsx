// Web: sem SDK de anúncio (D124). O aparelho usa expo-ads.native.tsx.
import { noAds, type AdsPort } from './port';

export function createAdsPort(): AdsPort {
  return noAds;
}
