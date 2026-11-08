// Arquivo aberto de fora do app (E05): "Abrir com" no Android (content://) ou "Abrir no CronôBR"
// no iPhone (file:// na Inbox). Vira a tela de importação com o endereço; o resto do app
// recebe o caminho como veio.
const FILE_SCHEMES = ['content://', 'file://'];

export function redirectIncoming(path: string): string {
  try {
    if (!FILE_SCHEMES.some((scheme) => path.startsWith(scheme))) return path;
    return `/importar?arquivo=${encodeURIComponent(path)}`;
  } catch {
    // Erro aqui derrubaria o app na abertura: na dúvida, segue para o início.
    return '/';
  }
}
