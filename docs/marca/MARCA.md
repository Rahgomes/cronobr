# Marca CronôBR

| Decisão | Valor | Quando |
| --- | --- | --- |
| Nome | **CronôBR** (circunflexo no segundo "o") | 07/11, Ramon |
| Logo | **Conceito 2, "C de tempo"**: C branco em arco de progresso + play, em quadrado laranja | 07/11, Ramon |
| Título nas lojas (candidato) | CronôBR: Tabata e HIIT | super PRD 00 |

## Kit (`final/`)

Tudo é gerado por `final/gerar.py` (vetor → PNG). Não edite PNG à mão: mude o script e rode
`python3 -I docs/marca/final/gerar.py`. Fonte do wordmark: Poppins Bold (licença OFL, em `final/fonte/`),
convertida em curvas, então os SVG não dependem de fonte instalada.

| Pasta | Arquivos | Uso |
| --- | --- | --- |
| `svg/` | `icone`, `icone-escuro`, `simbolo-{laranja,branco,preto}`, `lockup-fundo-{escuro,claro}`, `wordmark-fundo-{escuro,claro}`, `og-1200x630` | Site, documentos, qualquer tamanho |
| `png/` | `icone-{1024,512,192,48}`, `lockup-*@2x`, `simbolo-laranja-512`, `og-1200x630` | Redes, página institucional, prévia de link |
| `app/` | `icon`, `android-icon-{foreground,background,monochrome}`, `splash-icon`, `favicon` | Vão para `assets/images/` do app na fase de código |

## Uso

- Cores: laranja #FF6B35 · branco #FFFFFF · quase preto #121212 · cinzas #2A2A2A / #B0B0B0.
- Fundo escuro: lockup com "Cronô" branco. Fundo claro: "Cronô" #121212. "BR" sempre laranja.
- Área de respiro: no mínimo a altura do play em volta do logo. Tamanho mínimo do ícone: 24 px.
- Não usar: degradê, sombra, contorno, símbolo esticado, "CronoBR" sem acento.
- Pendente na fase de código: copiar `final/app/*` para `assets/images/` e trocar "CronoBR" no cabeçalho
  e nas traduções (`client/components/HeaderTitle.tsx`, `client/lib/i18n.ts`).

Conceitos que não foram escolhidos ficam em `arquivado/`.
