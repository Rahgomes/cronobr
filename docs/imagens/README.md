# Imagens de tela

| Arquivo | Tela | Situação |
| --- | --- | --- |
| `C01b-inicio-carrossel-dark.png` | Início com carrossel de modelos | Em uso. Implementada em parte (v2): carrossel por modalidade e Recentes; falta Início rápido (E04) |
| `C02-editor-rotina-dark.png` | Editor de rotina | Em uso. Nota: diz "3 blocos" e mostra 2 |
| `C03-sessao-ativa-dark.png` | Sessão, visualização Anel (padrão) | Em uso |
| `C03b-sessao-foco-dark.png` | Sessão, visualização Foco (travada) | Em uso |
| `C03c-sessao-lista-dark.png` | Sessão, visualização Lista | Em uso |
| `v2/` | Capturas do app novo (web, 390×844): Início, modalidade, ver todas | Conferência visual |
| `atual/` | Capturas do app como está hoje (web, 390×844) | Linha de base para comparar |
| `arquivado/` | Conceitos substituídos e a imagem antiga do Replit | Só histórico |

Conceito é referência para codificar. Depois que a tela for implementada, a captura real entra
aqui com o mesmo ID e o conceito vai para `arquivado/`.

## Fotos das modalidades

`assets/images/modalidades/*.jpg` (Tabata, HIIT, EMOM, AMRAP, Boxe, Circuito; Corrida e Mobilidade
em 08/11) foram geradas pelo
Codex com `fotos-modalidades.sh <nome> "<assunto>"` e reduzidas para 720×1080 JPEG q72 (~45 KB).
Regras do prompt: foto realista, sem texto nem marca, atleta adulto, terço de baixo escuro para o
título. Variar pessoa (homem e mulher, idades) entre os cards: o primeiro lote saiu com a mesma
mulher nos 6.

## C01b: o que já está na Início e o que falta

| Item do conceito | Situação | Onde entra |
| --- | --- | --- |
| Carrossel de modelos com foto, degradê e pontos | Feito, por modalidade (cada card abre os modelos dela) | v2 |
| "Última rotina" com Repetir | Feito como faixa Recentes (tocar repete o registro) | v2 |
| Cronômetro, Temporizador, Intervalado (início rápido) | Falta | E04 (configuração rápida) |
| Favoritas | Falta | E04 (acesso a favoritos) |
| Nova rotina | Falta | E04 (editor, C02) |
| Engrenagem (configurações) | Falta | E03 (som, voz e vibração) e E06 |
| "Bom treino, Lucas" | Sem nome nesta fase (sem login); só se houver perfil | E06 ou depois do Firebase |
