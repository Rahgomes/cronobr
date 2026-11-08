# E06 · Refinamento visual e acessibilidade

Refinar a interface sem perder fluxo, dado nem teste das etapas anteriores (super PRD 06). As
imagens-conceito do início, do editor e da sessão já existem desde 07/11 (`docs/imagens/C01b`,
`C02`, `C03`, `C03b`, `C03c`) e são a referência visual; esta etapa implementa com os componentes
reais do app e troca os conceitos por capturas das telas de verdade.

| Lote | Conteúdo | Situação |
| --- | --- | --- |
| A | Ajustes com tema (aparelho, claro, escuro) e idioma (aparelho, pt-BR, en, es, fr); base de textos em 4 línguas; aparência no backup; correções de passagem | Entregue 08/11 |
| B | Todos os textos nas 4 línguas: telas, motivos de recusa do arquivo, rótulos de fase, som e modalidade, datas, voz no idioma escolhido, modelos prontos traduzidos (nome escrito pela pessoa nunca muda) | Entregue 08/11 |
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

## 4. Lote B: o app inteiro nas 4 línguas

Duas partes. **B1 (Claude):** o domínio deixou de ter português fixo. **B2 (Codex, em 4 fatias
revisadas pelo Claude):** a extração dos textos das telas para `src/i18n/messages`, com as
traduções.

| Camada | Arquivo | O que mudou |
| --- | --- | --- |
| Domínio | `src/domain/words.ts` | Interface `Words`: o que o domínio escreve (voz, notificação, limites do editor, motivos de recusa do arquivo, nomes que o app dá ao criar). Quem chama passa `t.words` |
| Domínio | `src/domain/timeline.ts` | Segmento guarda só o nome escrito pela pessoa (`null` nas fases do app) e o lado como campo (`left`/`right`); o rótulo é montado na língua em uso |
| Domínio | `src/domain/limits.ts` | Schema de validação montado por língua (guardado em cache por língua) |
| Textos | `src/i18n/presets.ts`, `src/features/routines/presets.ts` | Modelos prontos traduzidos; `usePresets()` nas telas. A cópia de um modelo leva os nomes da língua de quando foi copiada |
| Textos | `src/i18n/messages/*.ts` | Seções `session`, `editor`, `home`, `routineOptions`, `history`, `quick`, `modality`, `transfer`, `cues`, `ui`, `boot` |
| Avisos | `src/features/cues/cue-context.tsx`, `expo-port.ts` | A voz fala na língua do app (pt-BR, en-US, es-ES, fr-FR); canais de notificação do Android na língua do aparelho |
| Telas | histórico e calendário | Datas, meses e letras dos dias da semana pelo `Intl` da língua em uso |
| Dados | `src/data/data-context.tsx` | Erro de armazenamento escolhe o texto pelo motivo (`unavailable`, `newer-version`, `corrupt`) |
| Kit | `src/ui/button.tsx` | Botão indisponível (que explica o motivo ao tocar) ficou cinza neutro com rótulo legível; a opacidade derrubava o laranja para 2,98:1. Achado pelo axe do E2E em inglês |

### Decisões do lote B

| # | Decisão | Por quê |
| --- | --- | --- |
| D77 | **Domínio recebe as palavras, não escolhe língua** (`Words` por parâmetro) | O domínio continua puro e testável com 100% de cobertura; voz, notificação e validação saem na língua da tela sem o domínio conhecer o i18n |
| D78 | **Nome da etapa é dado, rótulo da fase é texto** (`name: null` nas fases do app) | "Preparação" gravado na linha do tempo não traduzia. O nome escrito pela pessoa nunca muda; o que o app escreve segue a língua |
| D79 | **Modelos prontos traduzidos por tabela do texto em português**; a cópia congela a língua | Modelo é do app (segue a língua); cópia é da pessoa (não muda sozinha). O teste cobra cada texto de cada modelo em cada língua |
| D80 | **Voz na língua do app; canal de notificação na língua do aparelho** | A voz acompanha a tela. O canal aparece nos ajustes do sistema e é criado uma vez |
| D81 | **Extração delegada ao Codex em 4 fatias**, com briefing, plano revisado na primeira e diff revisado em todas | Trabalho mecânico em ~35 arquivos. O português ficou idêntico (os testes de tela não mudaram) |

### Testes do lote B

| Tipo | Arquivo | Cobre |
| --- | --- | --- |
| Unitário | `src/i18n/messages.test.ts` | Nenhum texto vazio ou "undefined" nas 4 línguas; nada esquecido em português no inglês e no francês; mensagens do domínio em outra língua; cada modelo traduzido |
| Unitário | testes do domínio | Passam `pt.words`; lado da mobilidade como campo |
| Tela | `cue-settings-screen.test.tsx`, `expo-port.test.ts` | Porta recebe a língua; voz em `en-US` |
| E2E + axe | `e2e/idiomas.spec.ts` | Navegador em `en-US`, `es-ES` e `fr-FR`: Início, modelo, sessão, editor, Ajustes, histórico, backup e avisos na língua, `<html lang>`, nada passando da largura da tela, axe nos dois temas |
