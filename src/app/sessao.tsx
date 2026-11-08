import { useLocalSearchParams } from 'expo-router';

import { parseQuick } from '@/domain/quick';
import { SessionScreen } from '@/features/session/session-screen';

export default function SessionRoute() {
  const params = useLocalSearchParams<Record<string, string>>();
  return (
    <SessionScreen
      routineId={params.rotina}
      repeatId={params.repetir}
      quick={parseQuick(params)}
      loop={params.denovo === '1'}
    />
  );
}
