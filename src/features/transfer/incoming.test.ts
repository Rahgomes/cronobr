import { redirectIncoming } from './incoming';

describe('arquivo aberto de fora', () => {
  it('content:// (Android) e file:// (iPhone) abrem a importação com o endereço', () => {
    const android = 'content://com.whatsapp.provider.media/item/123';
    expect(redirectIncoming(android)).toBe(`/importar?arquivo=${encodeURIComponent(android)}`);
    const ios = 'file:///private/var/mobile/Containers/Data/Inbox/treino%20perna.cronobr';
    expect(redirectIncoming(ios)).toBe(`/importar?arquivo=${encodeURIComponent(ios)}`);
  });

  it('link do app e caminho comum passam como vieram', () => {
    expect(redirectIncoming('cronobr://historico')).toBe('cronobr://historico');
    expect(redirectIncoming('/sessao')).toBe('/sessao');
  });

  it('caminho que quebra a codificação vai para o início em vez de derrubar o app', () => {
    expect(redirectIncoming('file://\uD800')).toBe('/');
  });
});
