# CronôBR: instruções para agentes (Codex)

App React Native de timer de treino intervalado (Tabata, HIIT, EMOM, AMRAP, boxe, circuito).
Offline, sem login. Leia isto antes de abrir arquivos; com briefing, não varra o repo.

## Stack

- Expo SDK 58, RN 0.88, React 19.3, **Expo Router** (rotas em `src/app`), TypeScript strict com
  `exactOptionalPropertyTypes` e `noUncheckedIndexedAccess`, React Compiler ligado. pnpm.
- Estilo: `StyleSheet` + tokens de `src/ui/tokens.ts` via `useColors()`/`useThemedStyles()`.
  Nunca hex solto em componente (o lint barra).
- Ícones: `@expo/vector-icons` (MaterialCommunityIcons).
- Nada de diálogo ou seletor nativo (D08): confirmação é `dialog` de `src/ui/dialog`, escolha é `Sheet`.
- Backend futuro: Firebase. Nunca Express.

## Camadas

```
src/app/            rota fina: lê params e renderiza a tela de src/features
src/features/<x>/   telas e componentes da funcionalidade + teste ao lado (*.test.tsx)
src/ui/             design system: reutilizável, sem dado
src/data/           repositórios (SQLite) e fakes para teste
src/domain/         regra pura, sem react-native (motor de tempo, formato .cronobr). Cobertura 100%
```

## Regras

- Texto da interface em pt-BR (i18n entra na E04). Telas de referência: `docs/telas/*.md` e
  `docs/imagens/` (ver o README de lá). Divergência necessária: avise numa linha
  `divergência de tela: <ID> · <o quê> · <por quê>`.
- Acessibilidade: todo tocável com `accessibilityRole` e rótulo; alvo mínimo 48dp; não desligar
  escala de fonte. Leitor de tela não anuncia cada segundo do timer, só mudança de fase.
- Ação principal da tela vai no `footer` da `Screen`.
- Comentário só para o porquê. Nenhum arquivo acima de ~250 linhas.
- Teste de componente de cada tela, na mesma rodada: estados e caminho feliz, consultando por papel
  e rótulo (RNTL 14: `render` e `fireEvent` são assíncronos, use `await`).
- Não instalar dependência. Precisou: `faltou no briefing: <x>`. Não commitar.
- `legado/` é o app antigo (SDK 54, Replit): só consulta, nunca importar.

## Verificar (rodar antes de dizer pronto)

```bash
pnpm typecheck
pnpm lint
pnpm exec jest --maxWorkers=2 <arquivos de teste novos>
```
