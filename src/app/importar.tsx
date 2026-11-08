import { useLocalSearchParams } from 'expo-router';

import { ImportScreen } from '@/features/transfer/import-screen';

export default function ImportRoute() {
  const { arquivo } = useLocalSearchParams<{ arquivo?: string }>();
  return <ImportScreen uri={arquivo} />;
}
