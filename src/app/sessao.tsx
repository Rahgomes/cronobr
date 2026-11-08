import { useLocalSearchParams } from 'expo-router';

import { SessionScreen } from '@/features/session/session-screen';

export default function SessionRoute() {
  const { rotina } = useLocalSearchParams<{ rotina?: string }>();
  return <SessionScreen routineId={rotina} />;
}
