# E06 · Refinamento visual e acessibilidade

Refinar a interface sem perder fluxo, dado nem teste das etapas anteriores (super PRD 06). As
imagens-conceito do início, do editor e da sessão já existem desde 07/11 (`docs/imagens/C01b`,
`C02`, `C03`, `C03b`, `C03c`) e são a referência visual; esta etapa implementa com os componentes
reais do app e troca os conceitos por capturas das telas de verdade.

| Lote | Conteúdo | Situação |
| --- | --- | --- |
| A | Ajustes com tema (aparelho, claro, escuro) e idioma (aparelho, pt-BR, en, es, fr); base de textos em 4 línguas; aparência no backup; correções de passagem | Entregue 08/11 |
| B | Todos os textos nas 4 línguas: telas, motivos de recusa do arquivo, rótulos de fase, som e modalidade, datas, voz no idioma escolhido, modelos prontos traduzidos (nome escrito pela pessoa nunca muda) | A fazer |
| C | Acessibilidade e layout: texto grande sem corte, contador com teto de escala, anúncio só em troca de fase, alvos de toque, alternativa a arrastar, movimento reduzido, paisagem na sessão, tablet e áreas seguras | A fazer |
| D | Refinamento pelas imagens-conceito: Início (última rotina e favoritas, começar em poucos toques), editor (avançado aos poucos), sessão (contador em destaque; preparar, executar, descansar e concluir por texto, som e cor; descanso entre etapas e entre blocos), estados de salvar, erro, vazio e importado; menos cartão e ícone decorativo | A fazer |
| E | Capturas reais por tela, tamanho, tema e língua, com dispositivos e dimensões anotados; conferência de que fluxos e dados das etapas anteriores seguem iguais | A fazer |

## 1. Lote A: o que entrou

| Camada | Arquivo | O que faz |
| --- | --- | --- |
| Domínio | `src/domain/appearance.ts` | Tema e idioma escolhidos, leitura tolerante do valor gravado, língua em uso a partir do aparelho |
| Textos | `src/i18n/messages/{pt,en,es,fr}.ts`, `src/i18n/i18n-context.tsx` | Textos por língua com o mesmo formato (o `tsc` cobra cada chave); `useT()` nas telas; `<html lang>` na web |
| Textos | `src/i18n/device.ts` | Línguas do aparelho (`expo-localization`), isoladas para teste |
| Recursos | `src/features/settings/appearance-context.tsx` | Lê a aparência gravada e envolve as telas com o tema e a língua escolhidos; grava antes de aplicar |
| Telas | `src/features/settings/settings-screen.tsx` (`/ajustes`) | Tema e idioma à vista; Som e avisos um toque adiante. A engrenagem da Início abre Ajustes |
| Dados | `src/data/data-context.tsx` | `useDataChanged()` / `useDataRevision()`: depois de restaurar ou desfazer, quem guarda preferência em memória relê |
| Config | `app.config.ts` | Plugin `expo-localization` com as 4 línguas (troca de idioma por app no Android 13+ e no iPhone) |

## 2. Decisões

| # | Decisão | Por quê |
| --- | --- | --- |
| D70 | **Textos em objetos tipados, sem biblioteca de i18n**. Português é a fonte; os outros idiomas são `Messages`; texto com número ou nome é função | Chave faltando em qualquer língua quebra o `tsc`, não aparece em produção. Plural e ordem das palavras ficam com cada língua. Nenhum peso novo além do `expo-localization` |
| D71 | **"Do aparelho" é o padrão** para tema e idioma; aparelho numa língua que o app não fala abre em **inglês** | Quem configurou o aparelho em alemão lê inglês melhor que português. O nome de cada língua aparece nela mesma ("Español"), para achar a sua sem ler a atual |
| D72 | **Aparência viaja no backup** (chave `aparencia`) | É escolha da pessoa, como avisos e jeito de ver o treino. Arquivo antigo sem a chave continua valendo (chave ausente = nada muda) |
| D73 | **Ajustes reúne tema e idioma; Som e avisos fica um toque adiante** | Personalização progressiva (PRD 06): o comum à vista, o detalhado num nível abaixo. A Início mantém três ações redondas |
| D74 | **Restaurar e desfazer avisam as telas abertas** | Avisos, aparência e favoritas eram lidos uma vez; depois de "Substituir tudo" a memória ficava com o valor antigo e a próxima mudança gravava por cima do restaurado (bug da E05, achado aqui) |
| D75 | **Voltar sem tela anterior leva à Início** | Página recarregada na web, ou link direto, deixava o botão sem efeito |
| D76 | **E2E com o navegador em pt-BR**; cada outra língua em teste próprio | O Chromium do Playwright é `en-US`; com "do aparelho" como padrão, a suíte inteira trocaria de língua |

## 3. Testes do lote A

| Tipo | Arquivo | Cobre |
| --- | --- | --- |
| Unitário | `src/domain/appearance.test.ts` | Valor gravado estranho volta ao padrão; escolha vence o aparelho; primeira língua conhecida; inglês na falta |
| Tela | `src/features/settings/settings-screen.test.tsx` | Padrão do aparelho, trocar tema e língua grava e aplica na hora, reabrir lê o gravado, falha ao gravar avisa, Som e avisos, releitura depois de restaurar |
| Tela | `src/ui/top-bar.test.tsx` | Voltar sem tela anterior vai para a Início |
| Unitário | `src/features/transfer/portable-prefs.test.ts` | `aparencia` entre as chaves que viajam |
| E2E + axe | `e2e/ajustes.spec.ts` | Inglês na hora, mantido ao recarregar, `<html lang>`, volta ao do aparelho; tema oposto ao sistema troca o fundo e fica gravado; axe nos dois temas |
