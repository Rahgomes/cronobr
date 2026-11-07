# Propostas de UX (rascunho para decisão, 07/11)

Vieram do retorno do Ramon sobre os conceitos C01–C03 e de dois vídeos de apps de referência
(`docs/videos-concorrentes/`, fora do git). Os apps não são citados por nome. Nada aqui está
decidido: cada item vira D## depois de aprovado.

## O que os vídeos mostram

| Ref. | Força | Fraqueza |
| --- | --- | --- |
| A (simples) | Configura em uma tela; o usuário escolhe **como ver** o timer (3 estilos); número gigante e 3 botões redondos | Sem pular ou voltar etapa; anúncio no topo da configuração e no rodapé do timer; termos variam (round, tabata, set) |
| B (lista) | Durante a sessão mostra **a sequência à frente** em lista; cadeado, pular e voltar; cards de rotina com resumo e total; ducking da música; voz configurável | Configurações com texto demais, em inglês; anúncio grande no fim do treino |

## P1 — Visualizações da sessão (Foco · Anel · Lista)

- **Foco** (C03b): número gigante, cor de fundo da fase, "Próxima" em uma linha. Para quem treina longe do celular.
- **Anel** (C03): o padrão; etapa atual, próxima, rodada, bloco e total.
- **Lista** (C03c): etapa atual destacada e as próximas rolando; as feitas aparecem apagadas.
- A troca fica num seletor discreto na sessão (só destravada) e na prévia. O app lembra a última escolha.
- Todas leem o mesmo estado do motor de tempo: a troca não tem custo de lógica, só de tela.

## P2 — Trava de toques

- Liga sozinha ao iniciar (preferência, padrão ligado).
- Travada: toque simples só mostra o aviso "segure o cadeado". **Segurar o cadeado por 1 s destrava.**
- Pausar continua possível travado, mas com toque **longo** no botão do centro. Assim parar nunca fica difícil, e esbarrar não pausa.
- Volta a travar sozinha após 5 s sem toque.

## P3 — Voltar e pular

- Botões só valem com a tela destravada.
- **Pular:** vai para o início da próxima etapa.
- **Voltar:** com mais de 3 s decorridos, reinicia a etapa atual; antes disso, volta para a anterior (como no player de música).
- Na visualização **Lista**, tocar numa linha pede confirmação e salta para ela. Assim dá para voltar à rodada 1 sem tocar 10 vezes.
- O histórico registra que houve salto (sessão "ajustada"), sem invalidar o treino.

## P4 — Voz, beep e vibração (três canais independentes)

| Canal | Quando toca | Serve para |
| --- | --- | --- |
| **Beep** | Contagem 3-2-1 no fim de cada etapa + tom próprio por fase (preparar, exercício, descanso, fim) | Saber a troca sem olhar e sem entender palavra |
| **Voz** | Frase na troca: "Agachamento, 40 segundos", "Descanso", "Próximo: flexão", "Metade", "Última rodada", "Treino concluído" | Treinar longe do celular e saber **o que** vem |
| **Vibração** | Pulso curto na troca e nos 3 últimos segundos | Celular no bolso, sem fone, ou ambiente barulhento |

- Na sessão, os três viram um único botão de som que abre um painel. Não ficam como três chaves na tela, como no C03.
- Os sons serão gerados no ElevenLabs na etapa 03. A lista de sons sai dessa tabela.

## P5 — Simples e completo ao mesmo tempo

- **Início:** três entradas e "Repetir última" resolvem 80% dos casos em 1 ou 2 toques. Editor, blocos e etapas só aparecem para quem toca em "Nova rotina" ou "Editar".
- **Sessão:** a visualização Foco é o modo "três botões". Quem quer detalhe escolhe Anel ou Lista.
- **Termos:** "Rodada" na interface em pt-BR, com dica de uma linha por modalidade ("Tabata: 20 s forte, 10 s leve, 8 vezes"). Em inglês, "Round". Nada de "Set" e "Cycle" juntos.
- **Anúncio** (etapa 08): banner só na Início e no Histórico. Nunca na sessão, na prévia ou no botão de iniciar. Sem intersticial no fim do treino.

## P6 — Modelos na Início

Os chips viraram um carrossel de cards com foto (C01b). Para lançar, as fotos precisam ser
geradas ou licenciadas. As do conceito são ilustrativas.

## P7 — Marca

- Hoje o ícone é um cronômetro 3D prateado em fundo degradê. Os ícones adaptativos do Android (`assets/images/android-icon-*`) ainda são o **padrão do Expo** (chevron azul), o que precisa ser corrigido.
- Nome decidido: **CronôBR** (com acento). Faltam o cabeçalho e as traduções, que ainda dizem "CronoBR".
- Conceitos de logo: 8 opções em `docs/marca/` (ver `MARCA.md`).

## P8 — Sons e vozes (para a etapa 03)

O Ramon quer opções para escolher. O pacote inicial, gerado no ElevenLabs:

- Vozes: algumas masculinas e algumas femininas, com tom humano, em pt-BR (depois EN, ES e FR).
- Sons por fase: gongo, sino de boxe, apito, beep curto e longo, e um som de conclusão.
- O usuário escolhe um som por fase e a voz; os três canais seguem independentes (P4).
