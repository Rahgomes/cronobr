// Porta de arquivos no Android e no iPhone: grava no cache, abre a folha de compartilhar do
// sistema e lê o que o seletor (ou o "Abrir com") entregou. Nunca guarda caminho do aparelho.
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { FilePort } from './file-port';

export function createFilePort(): FilePort {
  return {
    async share(name, text) {
      const file = new File(Paths.cache, name);
      if (file.exists) file.delete();
      file.create();
      await file.write(text);
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        UTI: 'public.json',
        dialogTitle: name,
      });
    },
    async pick() {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      const asset = result.canceled ? undefined : result.assets[0];
      return asset ? { uri: asset.uri } : null;
    },
    async read(uri, maxBytes) {
      const file = new File(uri);
      const size = file.size;
      if (size > maxBytes) return { text: '', size };
      return { text: await file.text(), size };
    },
  };
}
