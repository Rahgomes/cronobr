# E00 — Fundação (concluída em 08/11/2026)

## Entregue

| Item | Onde |
| --- | --- |
| Projeto novo Expo SDK 58 + Expo Router, TS strict, React Compiler, pnpm | `package.json`, `app.config.ts`, `src/app/` |
| Camadas do ManiVez e regras para agentes | `AGENTS.md` |
| Kit de UI vindo do ManiVez, na marca CronôBR (sem degradê, sem fonte do ManiVez): Text, Button, Screen, Sheet, Dialog, Card, Chip, Switch, TopBar, Hint, Notice, Divider, SectionTitle | `src/ui/` |
| Tema claro e escuro (escuro quando o sistema não informa), contraste AA medido em teste | `src/ui/tokens.ts`, `src/ui/theme.test.ts` |
| Marca aplicada: ícone, adaptativos do Android, splash, favicon e lockup | `assets/images/`, `src/ui/brand-mark.tsx` |
| Início provisória (marca + sheet própria) e página de não encontrado | `src/features/home/`, `src/app/+not-found.tsx` |
| Testes: Jest + RNTL (87), Playwright + axe no web (3 jornadas × tema claro e escuro) | `**/*.test.tsx`, `e2e/` |
| Lint strict + segurança, prettier, knip, lefthook (prettier, eslint, gitleaks, knip no pré-commit) | configs na raiz |
| CI: qualidade, segurança (gitleaks, osv), E2E web e prévia web depois dos verdes | `.github/workflows/ci.yml` |
| Projeto EAS `@rahgomes/cronobr` (ID `800a228d…`), OTA configurado, perfis de build | `eas.json`, `app.config.ts` |
| Prévia web no ar | https://cronobr--previa.expo.app |
| Express, Drizzle, React Query e scripts do Replit removidos; app antigo em `legado/` | D03 |

## Resultados

| Check | Resultado |
| --- | --- |
| `pnpm typecheck` | ok |
| `pnpm lint` | ok (0 avisos) |
| `pnpm test` | 87/87 |
| `pnpm e2e` | 6/6 (axe sem violação, claro e escuro) |
| `pnpm knip` | ok |
| `pnpm format:check` | ok |

## Pendências

- Segredo `EXPO_TOKEN` no GitHub (o job da prévia no CI depende dele). A prévia atual foi publicada
  do servidor.
- i18n (pt-BR, en, es, fr) entra com as telas na E04, portando os textos de `legado/client/lib/i18n.ts`.
- Fonte da marca no texto do app: decisão da E06.
- Maestro (nativo) entra com o development build, na E03.
