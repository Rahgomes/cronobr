# E01 — Auditoria da base e plano de evolução

Etapa 01 do super PRD (`docs/super-prd-evolucao/01`). Diagnóstico sem implementação.
Base auditada: commit `0ee3239` (código do app). Data: 07/11/2026.

## 1. Checks existentes (antes de qualquer mudança)

| Check | Resultado | Leitura |
| --- | --- | --- |
| `tsc --noEmit` | **1 erro** | `ConfirmationModal.tsx:134`: variante `"info"` não existe no `Button` |
| `expo lint` | 3.127 problemas | 3.084 são só formatação (prettier). Reais: 23 variáveis sem uso, **16 `exhaustive-deps`** (vários no timer), 4 imports duplicados |
| `prettier --check` | 51 arquivos fora do padrão | Formatação nunca foi aplicada |
| Testes | **nenhum** | Não há Jest, RNTL nem E2E configurados |
| Build web (`expo export`) | ok | Usado para capturar as telas em `docs/imagens/atual/` |

## 2. Matriz de funcionalidades

Legenda: ✅ completa · 🟡 parcial · 🖼️ só na interface · ❌ ausente

| Funcionalidade | Entrada na interface | Implementação real | Persistência | Testes | Lacuna |
| --- | --- | --- | --- | --- | --- |
| Início rápido | Home › Início Rápido | 🟡 abre `ManualConfig` com **1 s em tudo** (`ManualConfigScreen.tsx:58`) | `@cronobr/timer_config` | ❌ | Padrão sem sentido; deveria abrir com a última configuração |
| Modalidades (Tabata, HIIT, EMOM, AMRAP, Boxe, Circuito) | Home › cards | 🟡 todas viram o **mesmo** timer exercício/descanso/rodadas | Presets fixos em `storage.ts` | ❌ | EMOM sem fronteira de minuto; AMRAP sem teto de tempo nem contagem de rodadas |
| Mobilidade / Aquecimento | Home › card | 🖼️ abre os presets de **CIRCUITO** | — | ❌ | Não existe categoria própria; nome fixo em pt sem tradução |
| Corrida/caminhada, sequência personalizada | — | ❌ | — | — | Previsto no super PRD 04 |
| Rotina própria (salvar, editar, duplicar) | — | ❌ `saveCustomProfile` existe mas **nenhuma tela chama** | `@cronobr/workout_profiles` | ❌ | Confirmado: função órfã |
| Etapas com nome, blocos, descanso entre blocos | — | ❌ modelo só tem `prep/exercise/rest/rounds` | — | — | Modelo novo (E02) |
| Contador | Sessão | 🟡 `setInterval` de 1 s **decrementando** um estado | ❌ | ❌ | Deriva; para quando o JS pausa; efeitos colaterais dentro do `setState` (React pode chamar 2×) |
| Pausa / retomada | Sessão › PAUSAR | ✅ com duplo toque opcional | ❌ | ❌ | — |
| Encerrar | Sessão › PARAR | ✅ pede confirmação e salva interrompido | Histórico | ❌ | — |
| Fechar no **X** | Sessão › X | ❌ **sai sem confirmar e sem registrar** | ❌ | ❌ | Perda de sessão por toque acidental |
| Conclusão | automática | 🟡 sem descanso após a última rodada (prévia e execução concordam) | Histórico | ❌ | `saveToHistory` chamado dentro do updater: risco de **registro duplicado** |
| Recuperar sessão após fechar o app | — | ❌ | ❌ | — | Sessão em andamento não é gravada |
| Segundo plano / tela bloqueada | — | ❌ sem `AppState`, sem notificação, sem serviço | — | — | Ao voltar, o timer continua de onde parou, não do tempo real |
| Tela sempre acesa | automático | ✅ `expo-keep-awake` durante a sessão | Preferência | ❌ | O nome "screen lock" no código é "manter acesa", não "travar toques" |
| Travar toques | — | 🟡 só o duplo toque na pausa | Preferência | ❌ | Sem cadeado (P2) |
| Voltar / pular etapa | — | ❌ | — | — | P3 |
| Beep | Config. de som (beep1/2/3, volume) | 🖼️ **é vibração** (`Haptics`), não toca som; `expo-audio` instalado e sem uso | `@cronobr/sound_settings` | ❌ | Sem arquivo de áudio; volume não faz nada |
| Vibração por evento | Config. › padrões por evento | 🖼️ a tela de sessão **ignora** os padrões; usa vibração fixa | idem | ❌ | Configuração sem efeito |
| Voz (TTS) | Config. › voz | ✅ `expo-speech`, eventos configuráveis, desligada por padrão | `@cronobr/speech_settings` | ❌ | Falas podem se sobrepor (sem fila); contagem 5-1 falada a cada segundo |
| Modo silencioso | Config. › detectar | 🖼️ não detecta o aparelho: só considera "volume 0 ou todos os sons em nenhum" | Preferência | ❌ | Nome engana |
| Música junto | — | ❌ sem configuração de sessão de áudio (ducking) | — | — | E03 |
| Histórico | Home › menu › Histórico | ✅ lista, detalhe, apagar item | `@cronobr/workout_history` | ❌ | **Corta em 100 sem avisar**; grava o JSON inteiro a cada treino; sem nota nem calendário |
| Repetir do histórico | Detalhe | 🟡 a confirmar na E04 | — | ❌ | — |
| Backup / importar | — | ❌ | — | — | E05 |
| Cronômetro com voltas, temporizador simples | — | ❌ | — | — | E04 |
| Vários temporizadores, cadência | — | ❌ | — | — | E07 |
| Perfil (nome, avatar) | Menu › Perfil | ✅ | `@cronobr/profile` | ❌ | Pouco valor; candidato a simplificar |
| Idiomas pt-BR/en/es/fr | Config. | 🟡 1.296 linhas de tradução | Preferência | ❌ | Textos fixos em pt (cards da Home), "Round" e "Phases" sem tradução |
| Tema claro/escuro/sistema | Config. | ✅ | Preferência | ❌ | Contraste do timer reprova (texto branco sobre verde e amarelo) |
| Acessibilidade | — | ❌ **zero** `accessibilityLabel`/`Role` em telas e componentes | — | — | E06 |
| Rede no início | — | 🟡 `QueryClientProvider` montado, mas **nenhuma chamada** de rede | — | — | App já é offline; o provider sobra |
| Servidor Express + Drizzle | — | ❌ `routes.ts` vazio, `MemStorage` sem uso | — | — | Peso morto |
| Migração de dados | — | ❌ leitura faz `{...padrão, ...gravado}` sem versão | — | — | Sem `schemaVersion`; erro de leitura vira "padrão" em silêncio |
| Falha de gravação | — | 🟡 `try/catch` com `console.error`; usuário não fica sabendo | — | — | Leitura-modifica-grava sem trava: duas gravações juntas perdem uma |

## 3. Resumo por área

- **Tempo:** o maior risco. Contar decrementando a cada `setInterval` deriva e para no segundo plano.
  Os efeitos (som, fala, histórico) moram dentro do cálculo. A E02 separa motor puro (tempo
  derivado de um relógio) de efeitos.
- **Dados:** 10 chaves soltas no AsyncStorage, sem versão nem migração, e gravação concorrente sem
  proteção. Histórico truncado em silêncio. Rotina própria não existe para o usuário.
- **Áudio:** o "beep" é vibração; a vibração configurada não é usada; o modo silencioso não detecta
  nada. Três telas de configuração para pouca coisa real.
- **Interface:** o que está na tela promete mais do que entrega (Mobilidade, EMOM, AMRAP, silencioso).
- **Base técnica:** 1 erro de tipo, formatação nunca aplicada, zero testes, servidor sem uso.

## 4. Decisões (aprovadas pelo Ramon em 07/11, revisão 2)

O Ramon liberou mudança estrutural: o CronôBR é **reescrito** na base do ManiVez, levando a essência
(presets, textos traduzidos, tema, regras de sessão), não o código.

| # | Decisão | Por quê |
| --- | --- | --- |
| D01 | **Expo SDK 58 + Expo Router** (rotas em `src/app`), mesma base do ManiVez (RN 0.88, React 19.3, TS strict, React Compiler) | SDK 54 está 4 versões atrás; Router é o padrão atual do Expo (rota tipada, link profundo para abrir arquivo `.cronobr`, web pronto). Reaproveita a receita e o kit de UI do ManiVez |
| D02 | **`expo-sqlite`** para rotinas, histórico e sessão; preferências em armazenamento simples | Transação resolve gravação parcial e concorrente; histórico sem limite; migração versionada |
| D03 | **Remover** Express, Drizzle e React Query | Fase offline; backend futuro será **Firebase** (como no ManiVez), nunca Express |
| D04 | Motor de tempo puro, tempo derivado do relógio, marcos gravados | Aprovado |
| D05 | Jest + RNTL (unitário e componente), Playwright + axe no build web (E2E), Maestro no aparelho para o nativo | Aprovado. Cobertura de todos os tipos, como no ManiVez |
| D06 | Conta Expo do Ramon (`rahgomes`), **projeto novo `cronobr`**; nada no projeto do ManiVez | Prévia web por EAS Hosting e builds de desenvolvimento por EAS Build |
| D07 | Nome "CronôBR" | Decidido |
| D08 | **Nenhum diálogo ou seletor nativo**: confirmação, seletor de tempo, rodadas, som e voz viram `Sheet` e `Dialog` próprios do kit | Visual igual em Android e iOS; testável. O kit do ManiVez já tem `sheet`, `dialog`, `select`, `time-field` |
| D09 | Camadas do ManiVez: `src/app` (rota fina), `src/features/<x>` (tela + teste ao lado), `src/ui` (kit), `src/data` (repositórios + fake), `src/domain` (regra pura) | Regras do `AGENTS.md` do ManiVez valem aqui: tokens sem hex solto, a11y em todo tocável, arquivo até ~250 linhas |
| D10 | Backup entre aparelhos **sem nuvem**: arquivo `.cronobr` exportado pelo compartilhar do sistema (WhatsApp, e-mail, Drive, Arquivos) e importado no outro celular, **Android ↔ iOS** nos dois sentidos | Já é o escopo da E05; abrir o arquivo direto no app usa o link profundo do Router (D01). Sincronização automática fica para a fase Firebase |

Credencial: o token do Expo hoje está em `/root/.secrets/manivez.env` (`MANIVEZ_EXPO_TOKEN`), mas é
da **conta**, não do projeto. Proposta: mover para `/root/.secrets/expo.env` (`EXPO_TOKEN`) e os dois
apps lerem dele.

## 5. Plano por etapa

Cada etapa vira um PRD curto em `docs/evolucao/` antes do código e fecha com unitário + integração +
E2E verdes nos fluxos que tocou.

| Etapa | PRD | Entrega | Depende | Aceite objetivo |
| --- | --- | --- | --- | --- |
| E00 | Fundação | Projeto novo SDK 58 + Router com as camadas do ManiVez (D01, D09), kit de UI com Sheet/Dialog (D08), tokens e marca, i18n migrada, Jest + RNTL + Playwright + axe, CI, projeto `cronobr` no EAS e prévia web; código antigo vai para `legado/` até ser portado | — | `typecheck`, `lint` e testes verdes no CI; prévia web no ar |
| E02 | Contador e dados | Motor de tempo puro (D04), modelo de rotina com etapas e blocos, SQLite + migração dos dados antigos (D02), sessão recuperável, histórico sem truncar, X com confirmação | E00 | Os 10 testes do super PRD 02 passando; dados v1 migram sem perda (fixture) |
| E03 | Segundo plano e áudio | Prova técnica por plataforma, notificações, sons reais (pacote ElevenLabs, P8), voz com fila, vibração por evento, ducking | E02 + D06 | Matriz de cenários com evidência de aparelho |
| E04 | Rotinas e modalidades | Início (C01b), editor (C02), 3 visualizações da sessão (P1), trava (P2), voltar/pular (P3), cronômetro, temporizador, modalidades com comportamento próprio, histórico com calendário | E02 | Fluxos completos por E2E + persistência após reabrir |
| E05 | Backup | Formato `.cronobr` versionado, exportar/importar com prévia e atomicidade | E02, E04 | Biblioteca restaurada em outro sistema |
| E06 | Visual e acessibilidade | Marca nos assets, contraste, leitores de tela, texto grande, 4 idiomas sem corte, capturas reais substituindo os conceitos | E04 | Capturas + checagem de contraste + axe no web |
| E07 | Vários timers e cadência | Após critérios críticos de E02–E04 | E03, E04 | Testes de colisão e precisão |
| E08 | Lançamento | Banner com ID de teste (P5), textos de loja, relatório Android/iOS | Tudo | Matriz aprovado/reprovado/não testado |

**Ordem recomendada para começar:** E00 → E02. A E04 pode andar em paralelo à E03 depois da E02,
porque usa o mesmo motor e não depende de aparelho.

## 6. Riscos

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Segundo plano no iOS é limitado (sem processo vivo) | Avisos podem não tocar com o app suspenso | Notificações agendadas a partir do motor; documentar o limite em vez de prometer |
| Validação nativa depende do aparelho do Ramon | E03/E05 ficam "pendente" | Roteiro de teste curto por cenário, registro em tabela |
| Migração para SQLite | Perder histórico existente | Migração idempotente, com fixture dos dados v1 e cópia de segurança antes |
| Escopo da E04 é o maior | Lote longo | Quebrar em lotes: início → editor → sessão → modalidades → histórico |
| Fotos do carrossel | Licença | Gerar as fotos (sem pessoa real identificável) ou usar banco com licença comercial |

## 7. Critérios desta etapa

- [x] Matriz com interface, implementação, persistência, testes e lacuna
- [x] Diferença entre completo, parcial e só na interface
- [x] Checks existentes rodados e falhas registradas antes de mudar
- [x] Plano na ordem pedida, com dependências, riscos e aceite
- [ ] Comportamento em aparelho (segundo plano, áudio): **não auditado**, só código. Fica para a prova técnica da E03
