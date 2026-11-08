# E05 · Backup e transferência

Exportar e importar offline, igual no Android, no iPhone e na web (super PRD 05). Código entregue
em 08/11/2026 em três lotes. **A prova entre aparelhos (Android → iPhone e volta) depende do APK e
de um iPhone**; o formato e os caminhos da prévia web já estão cobertos por teste.

| Lote | Conteúdo | Situação |
| --- | --- | --- |
| A | Formato `.cronobr` v1, leitura com validação, plano de importação (novo, igual, conflito), gravação atômica, ponto de restauração | Entregue 08/11 |
| B | Telas: Backup (exportar com ou sem histórico, abrir arquivo, desfazer restauração), Importar (prévia e escolha), "Compartilhar" no menu da rotina | Entregue 08/11 |
| C | Abrir o arquivo vindo de fora: tipo declarado no iPhone, filtro de intenção no Android, redirecionamento para a importação | Código entregue 08/11; falta aparelho |

Especificação do formato: [`docs/spec/formato-cronobr.md`](../spec/formato-cronobr.md).

## 1. O que entrou

| Camada | Arquivo | O que faz |
| --- | --- | --- |
| Domínio | `src/domain/transfer.ts` | Gravar e ler o `.cronobr`: tamanho, JSON, cabeçalho, versão, schema e limites do editor; tudo ou nada. Impressão do conteúdo para achar duplicata com id diferente |
| Domínio | `src/domain/transfer-plan.ts` | Classifica (nova, igual, conflito) e monta as operações: compartilhar (adicionar, cópia, atualizar), juntar, substituir |
| Dados | `src/data/migrations.ts` (V6) | Tabela `restore_point` (um lugar só) com o estado anterior à restauração, no próprio formato `.cronobr` |
| Dados | `src/data/sqlite-repos.ts` (`transfer`) | Retrato da biblioteca, ids do histórico, aplicar numa transação (recusa substituir com treino em andamento), ponto de restauração |
| Recursos | `src/features/transfer/portable-prefs.ts` | Preferências que viajam e a adaptação (som desconhecido vira o padrão, favorita sem rotina sai, voz do aparelho) |
| Recursos | `src/features/transfer/file-port.tsx`, `expo-file-port.ts`, `expo-file-port.web.ts` | Porta de arquivos: `expo-sharing` + `expo-file-system` + `expo-document-picker` no aparelho; download e seletor do navegador na web |
| Telas | `backup-screen.tsx` (`/backup`), `import-screen.tsx` (`/importar`) | Exportar, abrir, prévia, juntar, substituir, desfazer |
| Telas | `src/features/routines/routine-options.tsx` | "Compartilhar" no "⋯" de qualquer rotina (também modelo pronto) |
| Config | `app.config.ts`, `src/app/+native-intent.tsx` | `UTExportedTypeDeclarations` e `CFBundleDocumentTypes` no iPhone; `intentFilters` no Android; `content://` e `file://` viram `/importar?arquivo=` |

## 2. Decisões

| # | Decisão | Por quê |
| --- | --- | --- |
| D57 | **JSON puro com extensão `.cronobr`**, sem zip | Sem áudio próprio não há binário a empacotar; JSON abre em qualquer lugar e é fácil de auditar. Pacote com manifesto fica para quando existir áudio |
| D58 | **Unidade no nome do campo** (`prepSeconds`, `activeMs`) e **datas ISO em UTC** | "Durações com unidade explícita e datas interoperáveis" sem inventar objeto `{valor, unidade}` |
| D59 | **Rotina compartilhada sem datas nem origem**: entra como própria, criada agora | Só o necessário para rodar; nada pessoal |
| D60 | **Validação inteira antes da prévia**, rotina pelos mesmos limites do editor; uma inválida recusa o arquivo todo, com o motivo | "Rejeitar antes de alterar dados"; o motor nunca vê o que o editor não deixaria salvar |
| D61 | **Duplicata por id e por conteúdo** (impressão sem ids e datas) | O mesmo treino exportado de outro aparelho tem ids diferentes nos blocos |
| D62 | **Atualizar rotina existente só por escolha explícita** com confirmação; o padrão é cópia | PRD |
| D63 | **Juntar não mexe nas preferências daqui**; substituir troca biblioteca e preferências, e o histórico só se veio no arquivo | Juntar é acrescentar; substituir é "deixar igual ao backup" |
| D64 | **Ponto de restauração no formato `.cronobr`**, gravado na mesma transação da restauração; desfazer é importar de volta | Cópia recuperável sem formato paralelo; um lugar só (a última restauração) |
| D65 | **Substituir com treino em andamento é recusado no banco**, não só escondido na tela | A sessão ativa guarda a rotina que roda; a checagem na transação fecha a corrida entre prévia e confirmação |
| D66 | **Preferências por lista branca**, cada uma pelo leitor que o app já usa | Chave nova do aparelho não vaza para o backup por descuido |
| D67 | **Voz não vai no arquivo além de ligada/desligada**; a prévia avisa que usa a voz do aparelho | O app não escolhe voz específica; não há voz para faltar no destino |
| D68 | **Android aceita `application/json` e `octet-stream` no "Abrir com"** | WhatsApp e Downloads raramente mandam o MIME próprio. O custo é o CronôBR aparecer na lista para outros JSON; o arquivo errado é recusado com mensagem |
| D69 | **Erro no redirecionamento de arquivo vai para o início** | Exceção no `+native-intent` derruba o app na abertura |

## 3. Testes

- Domínio 100%: ida e volta de rotina e backup (tempos, ordem, blocos, repetições, etapa manual,
  desativada, lados, EMOM, acento, emoji, aspas, nome de 60 letras), datas ISO, arquivo mínimo de
  versão anterior com campo desconhecido, recusa por tamanho, truncado, outro app, cabeçalho
  estragado, versão futura e zero, tipo errado, acima dos limites, id repetido, modalidade e data
  inválidas; plano (nova, igual por id e por conteúdo, conflito, cópia de nome longo, juntar,
  atualizar, substituir, resumo).
- Banco: retrato, juntar duas vezes sem duplicar, substituir mantendo o que é do aparelho, falha
  no meio sem nada aplicado (nem o ponto de restauração), treino em andamento.
- Tela com banco real: exportar com e sem histórico, falha ao gerar, abrir e desistir,
  compartilhar rotina, importar nova, igual e conflito, falha de gravação, arquivos recusados,
  link quebrado, juntar duas vezes, conflito no backup, substituir bloqueado com treino,
  **Android → iPhone** (dois bancos: o retrato do destino fica igual ao da origem) e desfazer.
- E2E com axe na prévia web: importar rotina escrita à mão pela especificação, achar na Início,
  compartilhar de volta (download), exportar backup, substituir, recarregar, desfazer, arquivo
  de outro app.

## 4. Pendente de aparelho

| Cenário | Android | iPhone |
| --- | --- | --- |
| Exportar backup pela folha de compartilhar | | |
| Abrir `.cronobr` por Arquivos / Downloads | | |
| Abrir `.cronobr` recebido no WhatsApp | | |
| Backup do Android restaurado no iPhone (e o contrário) | | |
| Arquivo grande (5 mil treinos) | | |

## 5. Correção de passagem

O E2E do rascunho do editor (E04 lote B) falhou uma vez com a máquina carregada: "Sair e
guardar rascunho" navegava antes de a última gravação terminar, e reabrir o editor podia ler o
rascunho antigo. Agora sair espera a fila do banco (uma leitura enfileirada só volta depois das
gravações anteriores). Repetido 3 vezes nos dois temas, sem falha.
