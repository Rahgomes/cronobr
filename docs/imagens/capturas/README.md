# Capturas reais (E06)

Telas do app como estão, tiradas da versão web exportada (`dist/`) pelo Playwright com Chromium.
Não são montagem: o mesmo código que roda no aparelho, renderizado pelo React Native Web.

Como refazer:

```bash
npm run export:web
npx playwright test -c playwright.capturas.config.ts   # via `heavy` no servidor
python3 capturas/reduzir.py                             # PNG 3x vira JPEG 780 px, q78
```

## Aparelhos e dimensões

| Pasta | Aparelho emulado | Janela (CSS px) | Escala | Tema | Língua |
| --- | --- | --- | --- | --- | --- |
| `escuro/` | iPhone 13 (perfil do Playwright, Chromium) | 390 x 664 | 3x | escuro | pt-BR |
| `claro/` | iPhone 13 | 390 x 664 | 3x | claro | pt-BR |
| `idiomas/` | iPhone 13 | 390 x 664 | 3x | escuro | en-US, es-ES, fr-FR |
| `tamanhos/pequeno-320x568-*` | celular pequeno | 320 x 568 | 1x | escuro | pt-BR |
| `tamanhos/tablet-1024x1366-*` | tablet em pé | 1024 x 1366 | 1x | escuro | pt-BR |
| `tamanhos/paisagem-915x412-*` | celular deitado | 915 x 412 | 1x | escuro | pt-BR |

664 de altura é a área útil do iPhone 13 no navegador (sem barras): o caso mais apertado entre
os celulares comuns. Arquivos com `-inteira`/`-inteiro` foram tirados com janela de 2400 de
altura, para mostrar a tela toda de uma vez.

## Telas (escuro/ e claro/)

| Arquivo | Tela | Estado |
| --- | --- | --- |
| `01-inicio-vazia` | Início | Primeiro uso, sem treino nem rotina |
| `02-modalidade` | Modalidade Tabata | Modelos prontos |
| `03-menu-rotina` | Menu "⋯" da rotina | Ações |
| `04-editor` | Editor | Cópia do Tabata clássico, nome trocado |
| `05-previa` | Prévia da sessão | Antes de começar |
| `06-sessao-anel-preparar` | Sessão, Anel | Preparação |
| `07-sessao-anel-exercicio` | Sessão, Anel | Exercício, rodada 1 |
| `08-sessao-foco-exercicio` | Sessão, Foco | Exercício |
| `09-sessao-foco-descanso` | Sessão, Foco | Descanso |
| `10-sessao-lista` | Sessão, Lista | Descanso |
| `11-sessao-pausada` | Sessão, Anel | Pausada |
| `12-concluido` | Fim do treino | Concluído |
| `13-inicio-com-uso` | Início | Última rotina, favorita e rotina própria |
| `14-historico` | Histórico | Um registro |
| `15-backup` | Backup e transferência | Sem ponto de restauração |
| `16-ajustes` | Ajustes | Padrão |
| `17-temporizador-novo` | Temporizadores (E07) | Formulário de criar |
| `18-temporizadores` | Temporizadores | Três: rodando, pausado, rodando |
| `19-temporizador-terminou` | Temporizadores | Diálogo "Ovo terminou" |
| `20-inicio-temporizadores` | Início | Visão compacta dos ativos |
| `21-metronomo` | Metrônomo (E07) | Tocando a 120 BPM, pulso aceso |
| `22-etapa-cadencia` | Editor, folha da etapa | Metrônomo nesta etapa a 120 BPM, com prévia |
| `23-sessao-cadencia` | Sessão | Exercício com cadência 120 BPM e pulso |
| `24-modalidades-novas` | Modalidades (E07 D) | Grade com Estudo e foco, Tarefas e Do profissional |
| `25-modalidade-foco` | Modalidade Estudo e foco | Modelos prontos |
| `26-sessao-foco` | Sessão de estudo | Fase "Foco" do Pomodoro |
| `27-modalidade-profissional` | Modalidade Do profissional | Exemplo e atalho para cadastrar sequência |
| `28-sequencia` | Cadastrar sequência | Prévia lida e aviso da linha sem tempo |
| `29-sequencia-no-editor` | Editor | Rotina criada da sequência, para revisar |

## Línguas (idiomas/)

Para cada língua: `01-inicio`, `02-ajustes`, `03-editor`, `04-sessao-anel`, `05-sessao-lista`.

## Tamanhos (tamanhos/)

Para cada tamanho: `01-inicio`, `02-editor`, `03-sessao-anel`, `04-sessao-foco`.

Observação: em 320 x 568 a visualização Anel rola para mostrar o cartão "Próxima" (o anel já
está no mínimo de 140). Tempo e controles ficam à vista sem rolar.
