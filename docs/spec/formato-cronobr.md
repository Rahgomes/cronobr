# Formato .cronobr (versão 1)

Arquivo de rotina compartilhada ou de backup do CronôBR. Igual no Android, no iPhone e na web.
Implementação: `src/domain/transfer.ts` (gravar e ler) e `src/domain/transfer-plan.ts` (o que a
importação faz).

## Regras gerais

- **JSON em UTF-8.** Nomes com acento, emoji e aspas vão como estão (o JSON escapa o que precisa).
- **Extensão `.cronobr`.** Tipo declarado no iPhone: `com.cronobr.app.arquivo` (conforma a
  `public.json`). MIME sugerido: `application/vnd.cronobr+json`; o app também aceita o arquivo
  vindo como `application/json` ou `application/octet-stream`.
- **Tamanho máximo: 16 MB.** Maior que isso é recusado sem ler o conteúdo.
- **Tempo com unidade no nome do campo:** `prepSeconds`, `seconds`, `restAfterSeconds`,
  `cooldownSeconds` (segundos inteiros), `activeMs` (milissegundos).
- **Datas em ISO 8601** com fuso (`2026-11-08T13:00:00.000Z`). O app grava sempre em UTC.
- **Ids estáveis** (texto, até 100 caracteres): são eles que dizem se uma rotina já existe.
- **Nada de caminho do aparelho, permissão, compra, token ou identificador de publicidade.**
- **Sons por nome** (`beepShort`, `beepLong`, `bell`, `gong`, `whistle`, `finish`). Áudio próprio
  ainda não existe; se existir um dia, vai num pacote com manifesto, limite e validação, numa
  versão nova do formato.
- **Voz:** o arquivo guarda só "voz ligada ou desligada". O aparelho que importa usa a voz dele em
  português.
- **O arquivo é dado, nunca código.** Campo desconhecido é ignorado; nada é executado.

## Cabeçalho (todos os arquivos)

| Campo | Tipo | Exemplo |
| --- | --- | --- |
| `format` | `"cronobr"` | identifica o formato |
| `schemaVersion` | inteiro | `1` |
| `appVersion` | texto | `"2.0.0"` (só informativo) |
| `exportedAt` | data ISO | `"2026-11-08T13:00:00.000Z"` |
| `kind` | `"routine"` ou `"backup"` | |

`schemaVersion` maior que o do app: recusado com "atualize o app". Menor que 1: recusado.

## Rotina

```json
{
  "id": "pernas",
  "name": "Pernas 🦵",
  "modality": "circuito",
  "version": 1,
  "prepSeconds": 10,
  "cooldownSeconds": 0,
  "blocks": [
    {
      "id": "b1",
      "name": "Bloco A",
      "repeat": 3,
      "restAfterSeconds": 30,
      "steps": [
        { "id": "s1", "name": "Agachamento", "kind": "work", "seconds": 40, "reps": null },
        { "id": "s2", "name": "Flexão", "kind": "work", "seconds": null, "reps": 12 },
        { "id": "s3", "name": "Avanço", "kind": "work", "seconds": 30, "reps": null, "sides": true },
        { "id": "s4", "name": "Pausa", "kind": "rest", "seconds": 20, "reps": null }
      ]
    }
  ]
}
```

- `modality`: `tabata`, `hiit`, `emom`, `amrap`, `boxe`, `circuito`, `corrida`, `mobilidade`,
  `personalizada`, `temporizador`.
- Etapa: `seconds: null` com `reps` = etapa por repetições. Opcionais: `disabled` (fica fora da
  execução), `sides` (roda lado esquerdo e lado direito), `early` (EMOM: dá para terminar antes).
- Passa pelos mesmos limites do editor (nome até 60 letras, até 99 rodadas, 20 blocos, 50 etapas
  por bloco, 6 horas no total). Fora disso o arquivo inteiro é recusado com o motivo.

## `kind: "routine"` (compartilhar)

Cabeçalho + `routine` (a rotina acima). **Só o necessário para rodar:** sem datas, sem origem,
sem histórico, sem preferências.

## `kind: "backup"`

Cabeçalho mais:

| Campo | Conteúdo |
| --- | --- |
| `routines` | Rotinas na ordem da lista do app, cada uma com `origin` (`custom`, `preset`, `legacy`), `createdAt` e `updatedAt` (ISO). Até 1.000 |
| `preferences` | Objeto por chave: `avisos`, `sessao`, `favoritos`, `rapido.intervalo`, `rapido.temporizador`. Chave desconhecida é ignorada; valor estranho volta ao padrão |
| `history` | Opcional (ausente = backup sem histórico). Até 20.000 registros: `id`, `routine` (a cópia que rodou), `status` (`completed`, `interrupted`), `startedAt`, `endedAt` (ISO), `activeMs`, `workDone`, `workTotal`, `source` (`app`, `legacy`) e, quando houver, `adjusted: true`, `rounds`, `note` |

Fica de fora do backup: cronômetro em andamento, rascunhos do editor, a marca de importação do
app antigo, treino em andamento e qualquer permissão do aparelho.

## Importação

1. Tamanho, JSON, cabeçalho, versão e conteúdo são validados **antes** de mostrar a prévia.
2. Rotina compartilhada: nova entra com o id do arquivo; igual (pelo id ou pelo conteúdo) avisa e
   oferece cópia; mesmo id com conteúdo diferente oferece cópia ou **substituir, com confirmação**.
3. Backup, **juntar**: rotinas novas entram, iguais ficam, diferentes viram cópia (ou usam a do
   arquivo, por escolha explícita). Histórico entra por id. Preferências daqui não mudam.
4. Backup, **substituir**: pede confirmação, guarda antes uma cópia completa do estado atual
   (desfazer em Backup) e é recusado com treino em andamento.
5. Tudo numa transação: falha no meio não deixa nada aplicado. Importar o mesmo arquivo de novo
   não duplica nada.
