// Porta de arquivos (E05): o que a tela pede ao sistema. No Android e no iPhone, a folha de
// compartilhar e o seletor de documentos; na web, download e o seletor do navegador. Os testes
// usam uma porta falsa.
import Constants from 'expo-constants';
import { createContext, useContext, type ReactNode } from 'react';

export interface PickedFile {
  /** Endereço para `read`: file://, content:// (Android) ou blob: (web). */
  uri: string;
}

export interface FilePort {
  /** Abre a folha de compartilhar com o arquivo (na web, baixa). */
  share(name: string, text: string): Promise<void>;
  /** Seletor de arquivo do sistema; null se a pessoa desistiu. */
  pick(): Promise<PickedFile | null>;
  /** Lê o arquivo. O tamanho vem antes do texto: arquivo grande demais nem é lido inteiro. */
  read(uri: string, maxBytes: number): Promise<{ text: string; size: number }>;
}

const FilePortContext = createContext<FilePort | null>(null);

export function FilePortProvider({ port, children }: { port: FilePort; children: ReactNode }) {
  return <FilePortContext.Provider value={port}>{children}</FilePortContext.Provider>;
}

/** Para telas que funcionam sem arquivos (testes antigos montam sem a porta). */
export function useOptionalFilePort(): FilePort | null {
  return useContext(FilePortContext);
}

export function useFilePort(): FilePort {
  const port = useContext(FilePortContext);
  if (!port) throw new Error('FilePortProvider ausente');
  return port;
}

/** Versão do app gravada no arquivo (informativa: quem decide a leitura é o schemaVersion). */
export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
