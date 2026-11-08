// Porta de arquivos na web (prévia): baixar o arquivo e escolher pelo seletor do navegador.
import * as DocumentPicker from 'expo-document-picker';

import type { FilePort } from './file-port';

export function createFilePort(): FilePort {
  return {
    share(name, text) {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      // O navegador já copiou o conteúdo para o download.
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      return Promise.resolve();
    },
    async pick() {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: false });
      const asset = result.canceled ? undefined : result.assets[0];
      return asset ? { uri: asset.uri } : null;
    },
    async read(uri, maxBytes) {
      const blob = await (await fetch(uri)).blob();
      if (blob.size > maxBytes) return { text: '', size: blob.size };
      return { text: await blob.text(), size: blob.size };
    },
  };
}
