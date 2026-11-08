import { useLocalSearchParams } from 'expo-router';

import { SessionScreen } from '@/features/session/session-screen';

export default function SessionRoute() {
  const { rotina, repetir } = useLocalSearchParams<{ rotina?: string; repetir?: string }>();
  return <SessionScreen routineId={rotina} repeatId={repetir} />;
}
