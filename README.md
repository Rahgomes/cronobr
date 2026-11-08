# CronôBR

Timer de treino intervalado para Android e iOS: Tabata, HIIT, EMOM, AMRAP, boxe e circuito.
Funciona offline, sem login.

- **Prévia web:** https://cronobr--previa.expo.app (publicada pelo CI depois dos testes verdes na `main`)
- **Plano de evolução:** `docs/evolucao/E01-auditoria-e-plano.md`
- **Marca:** `docs/marca/MARCA.md` · **Telas:** `docs/imagens/README.md`
- **Receita (como o app é construído):** `docs/receita/RECEITA.md`

## Rodar

```bash
pnpm install
pnpm web            # navegador
pnpm start          # Expo (QR code)
```

## Qualidade

| Comando                       | O quê                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `pnpm typecheck`              | TypeScript strict                                                              |
| `pnpm lint`                   | ESLint (typescript-eslint strict, segurança, ordem de import)                  |
| `pnpm test`                   | Jest + Testing Library (unitário e componente, cobertura 100% em `src/domain`) |
| `pnpm export:web && pnpm e2e` | Playwright + axe no build web, tema claro e escuro                             |
| `pnpm knip`                   | Arquivo, export ou dependência sem uso                                         |

No servidor de desenvolvimento, suíte inteira, build e instalação rodam pela fila `heavy`.
Antes de cada commit o `lefthook` roda prettier, eslint, gitleaks e knip nos arquivos alterados.

`legado/` guarda o app antigo (SDK 54) até tudo ser portado.
