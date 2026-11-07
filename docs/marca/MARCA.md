# Marca CronôBR

**Nome decidido (07/11, Ramon):** CronôBR, com acento circunflexo no segundo "o". Título candidato
nas lojas: "CronôBR: Tabata e HIIT". Pendente: trocar "CronoBR" no cabeçalho e nas traduções
(`client/components/HeaderTitle.tsx`, `client/lib/i18n.ts`); `app.json` e `AboutScreen` já usam "CronôBR".

## Conceitos de logo (escolher 1)

| Folha | Opções |
| --- | --- |
| `M02-logo-conceitos-acento.png` | 1 Anel · 2 C de tempo · 3 Intervalos · 4 Pulso |
| `M03-logo-conceitos-novos.png`  | 5 Clássico (versão chapada do ícone 3D atual) · 6 Acento · 7 Ampulheta · 8 Monograma |
| `M01-logo-conceitos.png`        | Primeira rodada, sem acento (arquivo histórico) |

As imagens são **conceito**. O logo final é redesenhado em vetor (SVG), porque PNG gerado por IA
não escala nem tem medidas exatas.

## Kit final (depois da escolha)

```
docs/marca/final/
  svg/      icone.svg · icone-mono.svg · lockup-horizontal-escuro.svg · lockup-horizontal-claro.svg · wordmark.svg
  png/      icone-1024.png · icone-512.png · icone-192.png · lockup-*-2x.png · og-1200x630.png
  app/      → copiados para assets/images: icon.png, splash-icon.png, favicon.png,
            android-icon-foreground.png, android-icon-background.png, android-icon-monochrome.png
  GUIA.md   cores, área de respiro, tamanho mínimo, usos certos e errados
```

- Os PNG saem de um script a partir dos SVG, sem edição manual, e podem ser refeitos quando quiser.
- Os ícones adaptativos do Android hoje são o padrão do Expo (chevron azul) e serão trocados pelo kit.
- O mesmo kit serve para a página institucional (lockup, favicon, imagem de compartilhamento 1200×630).

Cores: laranja #FF6B35 · branco #FFFFFF · quase preto #121212 · cinzas #2A2A2A / #B0B0B0.
