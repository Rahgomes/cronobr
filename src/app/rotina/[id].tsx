import { useLocalSearchParams } from 'expo-router';

import { EditorScreen } from '@/features/editor/editor-screen';

export default function EditorRoute() {
  const { id, de, modalidade } = useLocalSearchParams<{
    id: string;
    de?: string;
    modalidade?: string;
  }>();
  return <EditorScreen id={id} from={de} modality={modalidade} />;
}
