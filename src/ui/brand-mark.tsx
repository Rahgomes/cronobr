import { Image, StyleSheet } from 'react-native';

import { useColorSchemeInUse } from './theme-context';

const LOCKUP = {
  dark: require('@assets/images/lockup-escuro.png') as number,
  light: require('@assets/images/lockup-claro.png') as number,
};

/** Logo completo (símbolo + "CronôBR"), na versão do tema em uso. Arte em docs/marca/final. */
export function BrandMark({ height = 40 }: { height?: number }) {
  const scheme = useColorSchemeInUse();
  return (
    <Image
      source={LOCKUP[scheme]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="CronôBR"
      resizeMode="contain"
      style={[styles.logo, { height, width: height * ASPECT }]}
    />
  );
}

// Proporção do lockup gerado (2364×600).
const ASPECT = 2364 / 600;
const styles = StyleSheet.create({ logo: { alignSelf: 'flex-start' } });
