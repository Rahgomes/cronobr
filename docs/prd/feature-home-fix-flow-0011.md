# PRD: Correção de Fluxo de Navegação V9.2
**Feature ID:** feature-home-fix-flow-0011
**Version:** V9.2
**Date:** 2026-01-18
**Status:** Draft
**Priority:** P0 (Critical - Regression Fix)

---

## 1. CONTEXTO E PROBLEMA

### 1.1 Histórico de Versões
- **V9.0** (commit f08129f): Implementação da nova HomeScreen profissional com grid de modalidades
- **V9.1** (commit 4074158): Refinamentos visuais e componentes V2 (QuickStartCardV2, ModalidadeCardV2)
- **V9.2** (este PRD): Correção de regressões críticas de navegação

### 1.2 Regressões Identificadas

#### Problema 1: Menu Hambúrguer Desapareceu
**Telas afetadas:** HomeScreen, ManualConfigScreen

**Comportamento atual:**
- HomeScreen NÃO possui menu hambúrguer no `headerLeft`
- HomeScreen NÃO possui botão de settings no `headerRight`
- ManualConfigScreen NÃO possui menu hambúrguer
- Usuário não consegue acessar: Histórico, Perfis, Configurações, Som, Temas, Idioma

**Comportamento esperado:**
- HomeScreen deve ter menu hambúrguer (headerLeft) e settings (headerRight)
- ManualConfigScreen deve ter menu hambúrguer (headerLeft) e settings (headerRight)
- Menu deve permitir navegação para todas as telas secundárias

**Causa raiz:**
- HomeScreen foi criada mas não implementa `useLayoutEffect` com `navigation.setOptions()`
- ManualConfigScreen também não configura os header buttons
- MenuDrawer existe apenas em TimerConfigScreen, não é acessível da Home

---

#### Problema 2: Fluxo de Preset Pula Configuração Manual
**Tela afetada:** CategoryPresetsScreen

**Comportamento atual:**
```
HomeScreen
  → ModalidadeCardV2
  → CategoryPresetsScreen
  → [seleciona preset]
  → ❌ ActiveTimer (DIRETO, pula configuração)
```

**Comportamento esperado:**
```
HomeScreen
  → ModalidadeCardV2
  → CategoryPresetsScreen
  → [seleciona preset]
  → ✅ ManualConfigScreen (preenchida com preset)
  → [usuário pode editar]
  → ActiveTimer
```

**Causa raiz:**
- `CategoryPresetsScreen.handleSelectProfile()` navega direto para `ActiveTimer`
- Deveria navegar para `ManualConfig` passando o preset como parâmetro

---

#### Problema 3: ManualConfigScreen Não Recebe Preset
**Tela afetada:** ManualConfigScreen

**Comportamento atual:**
- `RootStackParamList` define `ManualConfig: undefined` (sem parâmetros)
- ManualConfigScreen não usa `route.params` para receber preset
- Sempre carrega configuração salva do storage

**Comportamento esperado:**
- `RootStackParamList` deve permitir `ManualConfig: { preset?: WorkoutProfile }`
- ManualConfigScreen deve verificar `route.params?.preset`
- Se preset existe, preenche os campos automaticamente
- Usuário pode editar antes de iniciar

**Causa raiz:**
- Type definition não permite passar parâmetros
- Componente não implementa lógica de recepção de preset

---

#### Problema 4: Layout Reduzido em ManualConfigScreen
**Tela afetada:** ManualConfigScreen

**Comportamento atual:**
- Tela exibe apenas:
  - Seta de voltar (headerLeft padrão)
  - Título "Configuração Manual"
  - Botão "Iniciar"
- NÃO exibe:
  - Menu hambúrguer
  - Blocos de edição de tempo (prep, exercise, rest, rounds)
  - Tempo total calculado

**Comportamento esperado:**
- Tela completa com todos os elementos:
  - Menu hambúrguer (headerLeft)
  - Settings (headerRight)
  - Hero section com título
  - Card de tempo total
  - 4 ConfigCards (prep, exercise, rest, rounds)
  - Modais de edição (TimePickerModal, RoundPickerModal)
  - Botão "Iniciar" fixo na parte inferior

**Causa raiz:**
- Análise da exploração mostra que ManualConfigScreen POSSUI todos os elementos
- Problema provavelmente está em:
  - Navegação incorreta (usando tela diferente)
  - CSS/layout condicional escondendo elementos
  - Ou usuário viu TimerConfigScreen (antiga) ao invés de ManualConfigScreen

**Nota:** Necessário verificar com usuário qual tela exatamente foi acessada.

---

## 2. OBJETIVOS DA V9.2

### 2.1 Objetivo Principal
Restaurar o fluxo de navegação completo e funcional sem alterar nenhum visual ou funcionalidade da V9/V9.1.

### 2.2 Objetivos Específicos

| ID | Objetivo | Sucesso |
|----|----------|---------|
| O1 | Adicionar menu hambúrguer à HomeScreen | Usuário consegue acessar Histórico, Perfis, Configurações |
| O2 | Adicionar menu hambúrguer à ManualConfigScreen | Usuário consegue acessar menu de qualquer ponto da configuração |
| O3 | Preset abre ManualConfigScreen (editável) | Usuário pode editar preset antes de iniciar |
| O4 | ManualConfigScreen aceita preset como parâmetro | Campos são preenchidos automaticamente |
| O5 | Manter todos os visuais da V9.1 | Zero mudanças de UI/UX |

---

## 3. REQUISITOS FUNCIONAIS

### RF-001: Menu Hambúrguer na HomeScreen
**Prioridade:** P0 (Critical)

**Descrição:**
HomeScreen deve exibir menu hambúrguer no canto superior esquerdo (headerLeft) e botão de settings no canto superior direito (headerRight).

**Critérios de aceite:**
- [ ] HeaderLeft exibe ícone de menu (Feather "menu")
- [ ] HeaderRight exibe ícone de settings (Feather "settings")
- [ ] Ao tocar no menu, abre MenuDrawer com opções:
  - Perfis (Profiles)
  - Histórico (History)
  - Configurações de Som (SoundSettings)
  - Configurações Avançadas (AdvancedSettings)
- [ ] Ao tocar em settings, navega para SettingsScreen
- [ ] Haptic feedback ao tocar nos botões

**Implementação:**
```typescript
// HomeScreen.tsx
React.useLayoutEffect(() => {
  navigation.setOptions({
    headerLeft: () => (
      <HeaderButton
        onPress={() => setMenuVisible(true)}
        pressColor={Colors.primary + "20"}
      >
        <Feather name="menu" size={24} color={theme.text} />
      </HeaderButton>
    ),
    headerRight: () => (
      <HeaderButton
        onPress={() => navigation.navigate("Settings")}
        pressColor={Colors.primary + "20"}
      >
        <Feather name="settings" size={24} color={theme.text} />
      </HeaderButton>
    ),
  });
}, [navigation, theme]);
```

---

### RF-002: Menu Hambúrguer na ManualConfigScreen
**Prioridade:** P0 (Critical)

**Descrição:**
ManualConfigScreen deve exibir menu hambúrguer no canto superior esquerdo e botão de settings no canto superior direito.

**Critérios de aceite:**
- [ ] HeaderLeft exibe ícone de menu (Feather "menu")
- [ ] HeaderRight exibe ícone de settings (Feather "settings")
- [ ] Ao tocar no menu, abre MenuDrawer (mesmo do HomeScreen)
- [ ] Ao tocar em settings, navega para SettingsScreen
- [ ] Haptic feedback ao tocar nos botões

---

### RF-003: Preset Navega para ManualConfigScreen
**Prioridade:** P0 (Critical)

**Descrição:**
Ao selecionar um preset em CategoryPresetsScreen, o sistema deve navegar para ManualConfigScreen com os campos preenchidos, permitindo edição antes de iniciar.

**Critérios de aceite:**
- [ ] CategoryPresetsScreen.handleSelectProfile() navega para "ManualConfig"
- [ ] Passa parâmetro `preset` com os dados do perfil selecionado
- [ ] NÃO navega direto para ActiveTimer
- [ ] NÃO inicia timer automaticamente
- [ ] Usuário pode editar qualquer campo (prep, exercise, rest, rounds)

**Fluxo esperado:**
```
HomeScreen
  → [toca modalidade]
  → CategoryPresetsScreen
  → [seleciona preset "HIIT Intenso"]
  → ManualConfigScreen {
      prepTime: 10,
      exerciseTime: 45,
      restTime: 15,
      rounds: 8,
      presetName: "HIIT Intenso",
      category: "hiit"
    }
  → [usuário pode editar]
  → [toca "Iniciar"]
  → ActiveTimer
```

---

### RF-004: ManualConfigScreen Aceita Preset como Parâmetro
**Prioridade:** P0 (Critical)

**Descrição:**
ManualConfigScreen deve aceitar um objeto `preset` opcional como parâmetro de rota e preencher os campos automaticamente.

**Critérios de aceite:**
- [ ] RootStackParamList atualizado: `ManualConfig: { preset?: PresetConfig }`
- [ ] ManualConfigScreen usa `route.params?.preset`
- [ ] Se preset existe, preenche `config` state com valores do preset
- [ ] Se preset não existe, carrega valores salvos do storage (comportamento atual)
- [ ] Campos são editáveis independente da origem (preset ou storage)

**Interface TypeScript:**
```typescript
// RootStackNavigator.tsx
type PresetConfig = {
  prepTime: number;
  exerciseTime: number;
  restTime: number;
  rounds: number;
  presetName?: string;
  category?: WorkoutCategory;
};

export type RootStackParamList = {
  Home: undefined;
  ManualConfig: { preset?: PresetConfig };  // ← ATUALIZADO
  CategoryPresets: { category: WorkoutCategory };
  ActiveTimer: {
    prepTime: number;
    exerciseTime: number;
    restTime: number;
    rounds: number;
    workoutType?: "preset" | "manual";
    presetName?: string;
    presetCategory?: WorkoutCategory;
  };
  // ... outras rotas
};
```

---

### RF-005: MenuDrawer Compartilhado
**Prioridade:** P1 (High)

**Descrição:**
Extrair componente MenuDrawer para arquivo separado para ser reutilizado em HomeScreen, ManualConfigScreen e TimerConfigScreen.

**Critérios de aceite:**
- [ ] Criar `/client/components/MenuDrawer.tsx`
- [ ] Mover lógica de MenuDrawer de TimerConfigScreen para o novo arquivo
- [ ] Aceitar `navigation` como prop
- [ ] HomeScreen usa MenuDrawer
- [ ] ManualConfigScreen usa MenuDrawer
- [ ] TimerConfigScreen usa MenuDrawer (refatorado)
- [ ] Mesma UI e comportamento em todas as telas

---

## 4. REQUISITOS NÃO-FUNCIONAIS

### RNF-001: Performance
- Menu deve abrir em < 100ms
- Navegação entre telas deve manter 60fps
- Haptic feedback não deve causar lag

### RNF-002: Compatibilidade
- iOS 13+
- Android 8.0+
- Web (browsers modernos)

### RNF-003: Acessibilidade
- Botões de menu devem ter labels acessíveis
- Suporte a screen readers
- Contraste de cores adequado

### RNF-004: Manutenibilidade
- Código compartilhado (MenuDrawer) entre telas
- TypeScript types corretos para navegação
- Comentários nos pontos críticos

---

## 5. USER FLOWS

### 5.1 Flow: Início Rápido (Quick Start)
```
[HomeScreen]
  ├─ Usuário vê grid de cards
  ├─ Usuário vê menu hambúrguer (headerLeft) ✅
  ├─ Usuário toca em "Início Rápido"
  │
[ManualConfigScreen - vazia]
  ├─ Campos carregam valores salvos do storage
  ├─ Usuário vê menu hambúrguer (headerLeft) ✅
  ├─ Usuário edita tempos: Prep 10s, Exercise 30s, Rest 15s, 5 rounds
  ├─ Usuário vê tempo total calculado: 3m 55s
  ├─ Usuário toca "Iniciar"
  │
[ActiveTimer]
  └─ Timer inicia com configuração manual
```

---

### 5.2 Flow: Selecionar Preset (OPÇÃO A - Recomendada)
```
[HomeScreen]
  ├─ Usuário vê grid de modalidades
  ├─ Usuário toca em "HIIT"
  │
[CategoryPresetsScreen - HIIT]
  ├─ Lista exibe 5 presets de HIIT
  ├─ Usuário toca em "HIIT Intenso"
  │   (45s exerc, 15s rest, 8 rounds)
  │
[ManualConfigScreen - preenchida]
  ├─ Campos preenchidos automaticamente:
  │   Prep: 10s
  │   Exercise: 45s
  │   Rest: 15s
  │   Rounds: 8
  ├─ Tempo total: 8m 10s
  ├─ Usuário pode editar qualquer campo ✅
  ├─ Usuário altera Exercise para 60s
  ├─ Tempo total atualiza: 10m 10s
  ├─ Usuário toca "Iniciar"
  │
[ActiveTimer]
  └─ Timer inicia com preset editado
      workoutType: "preset"
      presetName: "HIIT Intenso"
```

---

### 5.3 Flow: Acessar Menu de Qualquer Tela
```
[HomeScreen]
  ├─ Usuário toca menu hambúrguer (headerLeft)
  │
[MenuDrawer Modal]
  ├─ Opções:
  │   - Perfis
  │   - Histórico
  │   - Configurações de Som
  │   - Configurações Avançadas
  ├─ Usuário toca "Histórico"
  │
[HistoryScreen]
  └─ Lista de treinos completados
```

---

## 6. FORA DO ESCOPO (V9.2)

As seguintes funcionalidades NÃO serão alteradas nesta versão:

- ❌ Timer engine (ActiveTimerScreen)
- ❌ TTS / narração de áudio
- ❌ Histórico de treinos
- ❌ Sistema de presets (criar/editar/deletar)
- ❌ Temas visuais
- ❌ Idiomas / i18n (apenas corrigir chave preview se necessário)
- ❌ Configurações de som
- ❌ Layout visual dos cards V2 (QuickStartCardV2, ModalidadeCardV2)
- ❌ Animações de entrada da HomeScreen
- ❌ Cores, tipografia, espaçamentos

---

## 7. CRITÉRIOS DE ACEITE GLOBAIS

### Teste 1: Menu Hambúrguer Visível
- [ ] Abrir app
- [ ] HomeScreen exibe menu hambúrguer no canto superior esquerdo
- [ ] Tocar no menu abre drawer com 4 opções
- [ ] Navegar para ManualConfigScreen
- [ ] ManualConfigScreen exibe menu hambúrguer no canto superior esquerdo

### Teste 2: Preset Editável
- [ ] Abrir app
- [ ] Tocar em modalidade "HIIT"
- [ ] CategoryPresetsScreen exibe lista de presets
- [ ] Tocar em preset "HIIT Intenso"
- [ ] ManualConfigScreen abre com campos preenchidos
- [ ] Editar tempo de exercício de 45s para 60s
- [ ] Tempo total atualiza automaticamente
- [ ] Tocar "Iniciar"
- [ ] ActiveTimer inicia com valores editados

### Teste 3: Início Rápido Completo
- [ ] Abrir app
- [ ] Tocar em "Início Rápido"
- [ ] ManualConfigScreen abre com campos vazios/storage
- [ ] Todos os elementos visíveis: hero, total time, 4 config cards, botão iniciar
- [ ] Menu hambúrguer visível
- [ ] Editar campos funciona normalmente
- [ ] Tocar "Iniciar" navega para ActiveTimer

### Teste 4: Nenhuma Regressão
- [ ] Timer funciona normalmente (prep → exercise → rest → rounds)
- [ ] TTS narra corretamente
- [ ] Histórico salva treinos completados
- [ ] Configurações de som funcionam
- [ ] Temas claro/escuro funcionam
- [ ] Idiomas funcionam
- [ ] Todos os visuais da V9.1 mantidos

---

## 8. RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Quebrar navegação existente | Média | Alto | Testar todos os fluxos após mudanças |
| TypeScript errors em types | Baixa | Médio | Atualizar RootStackParamList antes de implementar |
| MenuDrawer duplicado | Baixa | Baixo | Extrair para componente compartilhado |
| Preset não preenche campos | Média | Alto | Implementar useEffect para detectar route.params |
| Menu não abre | Baixa | Alto | Copiar implementação exata de TimerConfigScreen |

---

## 9. DEPENDÊNCIAS

### Arquivos que serão modificados:
- `client/screens/HomeScreen.tsx` - Adicionar menu
- `client/screens/ManualConfigScreen.tsx` - Adicionar menu + aceitar preset
- `client/screens/CategoryPresetsScreen.tsx` - Mudar navegação
- `client/navigation/RootStackNavigator.tsx` - Atualizar types
- `client/components/MenuDrawer.tsx` - NOVO arquivo (extrair de TimerConfigScreen)
- `client/screens/TimerConfigScreen.tsx` - Refatorar para usar MenuDrawer compartilhado

### Dependências externas:
- React Navigation (já instalado)
- Expo Haptics (já instalado)
- Feather Icons (já instalado)

---

## 10. CRONOGRAMA E FASEAMENTO

### Fase 1: Preparação (este documento)
- [x] Análise de código
- [x] Identificação de regressões
- [x] Criação do PRD

### Fase 2: Especificação Técnica
- [ ] Criar SPEC completo
- [ ] Definir interfaces TypeScript
- [ ] Pseudocódigo de implementação

### Fase 3: Implementação
- [ ] Atualizar RootStackParamList
- [ ] Criar MenuDrawer compartilhado
- [ ] Adicionar menu à HomeScreen
- [ ] Adicionar menu à ManualConfigScreen
- [ ] Atualizar CategoryPresetsScreen
- [ ] Atualizar ManualConfigScreen para aceitar preset

### Fase 4: Testes
- [ ] Testes de navegação
- [ ] Testes de preset
- [ ] Testes de regressão
- [ ] Testes de acessibilidade

---

## 11. MÉTRICAS DE SUCESSO

| Métrica | Antes (V9.1) | Meta (V9.2) |
|---------|-------------|-------------|
| Menu acessível da Home | ❌ 0% | ✅ 100% |
| Preset editável | ❌ 0% (pula) | ✅ 100% |
| Navegação completa | ⚠️ 60% | ✅ 100% |
| Regressões | 3 críticas | 0 |
| User satisfaction | ⚠️ 60% | ✅ 95%+ |

---

## 12. APROVAÇÕES

| Papel | Nome | Status | Data |
|-------|------|--------|------|
| Product Owner | - | Pending | - |
| Tech Lead | - | Pending | - |
| QA Lead | - | Pending | - |

---

## APÊNDICES

### A. Referências
- [docs/prd/feature-home-profissional-0009.md](../prd/feature-home-profissional-0009.md) - PRD V9.0
- [docs/prd/feature-home-profissional-refinements-0010.md](../prd/feature-home-profissional-refinements-0010.md) - PRD V9.1
- [client/screens/HomeScreen.tsx](../../client/screens/HomeScreen.tsx) - Código atual
- [client/screens/ManualConfigScreen.tsx](../../client/screens/ManualConfigScreen.tsx) - Código atual
- [client/screens/CategoryPresetsScreen.tsx](../../client/screens/CategoryPresetsScreen.tsx) - Código atual

### B. Glossário
- **Preset**: Perfil de treino pré-configurado com tempos específicos
- **Quick Start**: Início rápido com configuração manual
- **MenuDrawer**: Modal com opções de navegação secundárias
- **HeaderButton**: Botão customizado no header da navegação
- **WorkoutCategory**: Tipo de treino (HIIT, Tabata, AMRAP, EMOM, For Time, Custom)

---

**Fim do PRD V9.2**
