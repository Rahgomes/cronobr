import { useLocalSearchParams } from 'expo-router';

import { ModalityScreen } from '@/features/modality/modality-screen';

export default function ModalityRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <ModalityScreen id={id} />;
}
