# PRD – Home Profissional: Hub de Modalidades
ID: feature-home-profissional-0009
Data: 2026-01-18
Versão: V9.0
Autor: CronôBR Team

---

## 1. Resumo

A V9 transforma a tela inicial (TimerConfigScreen) do CronôBR em um moderno "hub de modalidades", permitindo que usuários naveguem e iniciem treinos através de cartões visuais representando diferentes modalidades de exercício (HIIT, Tabata, EMOM, AMRAP, Boxe, Mobilidade). O objetivo é criar uma experiência de primeiro acesso mais intuitiva, moderna e amigável para iniciantes, inspirada em apps top da Play Store como SmartWOD Timer e Seconds Interval Timer.

---

## 2. Contexto / Motivação

**Problemas Atuais:**

1. **Interface não intuitiva para novos usuários**: A tela atual (TimerConfigScreen) exige que o usuário configure manualmente todos os parâmetros de treino ou navegue até o menu drawer para encontrar perfis pré-configurados
2. **Modalidades escondidas**: As 6 modalidades de treino (HIIT, Tabata, EMOM, AMRAP, Boxe, Circuito) existem no sistema mas não são visualmente destacadas na interface principal
3. **Drawer sobrecarregado**: O menu drawer atualmente serve tanto para configurações quanto para navegação de treinos, criando uma experiência confusa
4. **Falta de contexto visual**: Não há representação visual clara das diferentes modalidades de treino, dificultando o entendimento do que cada uma oferece
5. **Sem acesso rápido ao último treino**: Usuários que repetem treinos frequentemente precisam reconfigurá-los manualmente

**Impacto Negativo:**

- Taxa de abandono alta em novos usuários que não entendem como começar
- Usuários intermediários não descobrem todas as modalidades disponíveis
- Falta de diferenciação visual do app em relação a competidores
- Experiência de usuário não profissional/moderna

**Benefícios da V9:**

- Primeira impressão moderna e profissional
- Descoberta imediata de modalidades disponíveis
- Acesso rápido a treinos recentes e favoritos
- Interface alinhada com apps top de mercado
- Preparação do terreno para futuras features (calendário V10, estatísticas V11)

---

## 3. Escopo (IN)

Esta versão **DEVE** incluir:

- ✅ Nova HomeScreen substituindo/refatorando TimerConfigScreen
- ✅ Grid de cartões de modalidades (2 colunas responsivas)
- ✅ 6 cartões de modalidade: HIIT/Funcional, Tabata Clássico, EMOM, AMRAP, Boxe/Rounds, Mobilidade/Aquecimento
- ✅ Cada cartão com: ícone, nome em português, nome técnico, descrição curta
- ✅ Cartão "Início Rápido" fixo no topo para configuração manual
- ✅ Cartão "Último Treino" (condicional - só aparece se houver histórico)
- ✅ Botão "Repetir Treino" no cartão de último treino
- ✅ Animações de entrada (FadeInDown ou similar com delays progressivos)
- ✅ Haptic feedback em todas as interações de cartões
- ✅ Drawer minimalista (apenas Histórico, Configurações, Som e Narração, Tema, Idioma, Sobre)
- ✅ Remoção da navegação de modalidades do Drawer
- ✅ Internacionalização completa (PT-BR, EN, ES, FR)
- ✅ Suporte a tema claro/escuro
- ✅ Tipagem TypeScript 100%
- ✅ Compatibilidade com arquitetura existente

---

## 4. Fora de Escopo (OUT)

Esta versão **NÃO** inclui:

- ❌ Calendário de treinos (planejado para V10)
- ❌ Estatísticas e métricas de progresso (planejado para V11)
- ❌ Sistema de favoritos/marcação de treinos (V12+)
- ❌ Reordenação de cartões de modalidade
- ❌ Customização de cores/ícones das modalidades
- ❌ Criação de novas modalidades pelo usuário
- ❌ Integração com backend/sincronização cloud
- ❌ Widgets ou app shortcuts
- ❌ Notificações ou lembretes de treino
- ❌ Edição inline de presets na Home

---

## 5. Requisitos Funcionais (RF)

**RF01** — A Home deve exibir um grid de 2 colunas com 6 cartões de modalidade

**RF02** — Cada cartão de modalidade deve exibir:
- Ícone representativo da modalidade (Ionicons)
- Nome em português (traduzido por idioma)
- Nome técnico em caps (HIIT, TABATA, EMOM, AMRAP, BOXE, MOBILIDADE)
- Descrição curta (1 linha explicativa)
- Cor de destaque específica por modalidade

**RF03** — Ao tocar em um cartão de modalidade, o usuário deve ser direcionado para a tela CategoryPresetsScreen com a categoria selecionada

**RF04** — O cartão "Início Rápido" deve estar fixo no topo da Home, permitindo configuração manual de treino (comportamento atual do TimerConfigScreen)

**RF05** — O cartão "Último Treino" deve aparecer apenas se existir pelo menos 1 entrada no histórico

**RF06** — O cartão "Último Treino" deve exibir:
- Nome da modalidade ou "Treino Manual"
- Duração total do treino
- Data/hora do treino
- Botão "Repetir Treino"

**RF07** — Ao tocar em "Repetir Treino", o app deve:
- Carregar a configuração exata do último treino
- Navegar para ActiveTimerScreen iniciando o treino imediatamente

**RF08** — O Drawer deve conter apenas:
- Histórico de Treinos
- Configurações
- Som e Narração
- Tema (se não houver nas Configurações)
- Idioma (se não houver nas Configurações)
- Sobre

**RF09** — Todos os cartões devem ter animação de entrada (FadeInDown) com delays progressivos (0ms, 100ms, 200ms, etc.)

**RF10** — Todos os toques em cartões devem emitir haptic feedback (ImpactFeedbackStyle.Medium)

**RF11** — Todas as strings devem ser internacionalizadas em 4 idiomas (PT-BR, EN, ES, FR)

**RF12** — Os cartões devem respeitar o tema claro/escuro ativo

**RF13** — A navegação pela Home deve ser fluida sem lags perceptíveis (< 16ms por frame)

---

## 6. Requisitos Não-Funcionais (RNF)

**RNF01** — **Performance**: Renderização inicial da Home em < 300ms em dispositivos mid-range

**RNF02** — **Acessibilidade**: Todos os cartões devem ter área de toque mínima de 48x48dp (Spacing.inputHeight)

**RNF03** — **Tipagem**: 100% do código TypeScript tipado, sem uso de `any`

**RNF04** — **i18n**: Todas as strings extraídas para i18n, sem hardcoding de textos

**RNF05** — **Responsividade**: Layout deve adaptar-se a telas de 320px até tablets

**RNF06** — **Tema**: Todos os componentes devem usar `useTheme()` hook para cores dinâmicas

**RNF07** — **Animações**: Usar react-native-reanimated para animações (consistência com codebase)

**RNF08** — **Persistência**: Estado do último treino deve ser lido do HistoryContext

**RNF09** — **Organização**: Componentes reutilizáveis devem ser criados em `/components`

**RNF10** — **Testes**: Código deve compilar sem warnings TypeScript

**RNF11** — **Compatibilidade**: Manter compatibilidade com Expo SDK 54 e React Native atual

**RNF12** — **Padrões**: Seguir padrões arquiteturais existentes (Context API, AsyncStorage, atomic components)

---

## 7. User Flow (Fluxo do Usuário)

### Fluxo 1: Novo usuário explorando modalidades

1. Usuário abre o app pela primeira vez
2. Vê a HomeScreen com título "CronôBR" e subtítulo "Escolha sua modalidade de treino"
3. Visualiza 6 cartões coloridos de modalidades em grid 2 colunas
4. Lê descrições curtas de cada modalidade
5. Toca no cartão "HIIT / Funcional" (haptic feedback)
6. É direcionado para CategoryPresetsScreen com presets de HIIT
7. Seleciona um preset "Sprint HIIT"
8. App navega para ActiveTimerScreen e inicia treino

### Fluxo 2: Usuário experiente repetindo último treino

1. Usuário abre o app
2. Vê cartão "Último Treino" destacado no topo
3. Cartão mostra: "Tabata Clássico - 4min - Ontem 18:30"
4. Toca no botão "Repetir Treino" (haptic feedback)
5. App carrega configuração do Tabata
6. Navega diretamente para ActiveTimerScreen iniciando treino

### Fluxo 3: Usuário configurando treino manual

1. Usuário quer criar treino customizado
2. Toca no cartão "Início Rápido"
3. É direcionado para tela de configuração manual (atual TimerConfigScreen)
4. Ajusta preparação, exercício, descanso, rounds
5. Toca em "Iniciar Treino"
6. App navega para ActiveTimerScreen

### Fluxo 4: Acessando histórico via Drawer

1. Usuário toca no ícone de menu (hamburger) no header
2. Drawer desliza da esquerda
3. Vê opções limpas: Histórico, Configurações, Som e Narração, Sobre
4. Toca em "Histórico de Treinos"
5. Drawer fecha
6. App navega para HistoryScreen

---

## 8. Critérios de Aceite (QA / Testes)

**Home Layout:**
- [ ] Grid de modalidades exibe 2 colunas em smartphones
- [ ] Cartões têm espaçamento consistente (Spacing.m)
- [ ] Cartões respeitam minHeight para toque confortável
- [ ] Scroll funciona suavemente em dispositivos baixo-end

**Cartões de Modalidade:**
- [ ] Todos os 6 cartões aparecem corretamente
- [ ] Ícones e cores corretas para cada modalidade
- [ ] Nomes e descrições traduzidos em 4 idiomas
- [ ] Animações FadeInDown funcionam sem travamentos
- [ ] Haptic feedback funciona em iOS/Android (não web)
- [ ] Navegação para CategoryPresetsScreen funciona

**Cartão "Início Rápido":**
- [ ] Sempre visível independente de histórico
- [ ] Navega para tela de configuração manual
- [ ] Mantém comportamento atual do TimerConfigScreen

**Cartão "Último Treino":**
- [ ] Não aparece se histórico vazio
- [ ] Aparece se houver pelo menos 1 treino no histórico
- [ ] Exibe informações corretas (nome, duração, data)
- [ ] Botão "Repetir Treino" carrega config correta
- [ ] Inicia treino com parâmetros idênticos ao original

**Drawer:**
- [ ] Contém apenas: Histórico, Configurações, Som e Narração, Sobre
- [ ] Não contém mais navegação para modalidades
- [ ] Animação de abertura/fechamento suave
- [ ] Botão X de fechar funciona

**i18n:**
- [ ] Todas as strings traduzidas em PT-BR
- [ ] Todas as strings traduzidas em EN
- [ ] Todas as strings traduzidas em ES
- [ ] Todas as strings traduzidas em FR
- [ ] Mudança de idioma atualiza todos os textos

**Temas:**
- [ ] Tema claro exibe cores corretas
- [ ] Tema escuro exibe cores corretas
- [ ] Transição entre temas funciona sem bugs visuais
- [ ] Todos os cartões respeitam theme.backgroundDefault

**TypeScript:**
- [ ] Código compila sem erros
- [ ] Nenhum uso de `any` type
- [ ] Interfaces bem definidas para props de componentes

**Performance:**
- [ ] Renderização inicial < 300ms
- [ ] Animações a 60fps em dispositivos mid-range
- [ ] Sem memory leaks ao navegar de/para Home

---

## 9. Benchmarks / Referências

**Apps de Referência:**

1. **SmartWOD Timer**
   - Grid limpo de modalidades
   - Cards grandes e visuais
   - Cores distintas por tipo de treino

2. **Seconds Interval Timer**
   - Layout moderno com cards
   - Acesso rápido a treinos recentes
   - Navegação intuitiva

3. **Nike Training Club**
   - Home como hub central
   - Categorias visuais em destaque
   - Design profissional e clean

4. **Strava / Runkeeper**
   - Botão "Iniciar Treino" destacado
   - Histórico acessível mas não invasivo

**Elementos de Design a Seguir:**

- Grid de cards com 2 colunas
- Ícones grandes e coloridos
- Tipografia hierárquica (h1 > h3 > caption)
- Espaçamento generoso
- Animações sutis mas presentes
- Cores de marca (Orange #FF6B35) + cores secundárias por modalidade

---

## 10. Riscos / Observações

**Riscos Técnicos:**

1. **Performance de animações**: Grid com 6+ cards animados pode causar lag em dispositivos antigos
   - **Mitigação**: Usar react-native-reanimated com otimizações, limitar número de cards com animações simultâneas

2. **Complexidade de navegação**: Refatorar TimerConfigScreen pode quebrar fluxos existentes
   - **Mitigação**: Manter tela de configuração manual separada, apenas mudar ponto de entrada

3. **i18n extensivo**: Muitas strings novas para traduzir
   - **Mitigação**: Revisar traduções em batch, usar ferramentas de validação

**Observações de UX:**

1. **Aprendizado de interface**: Usuários atuais podem estranhar mudança radical
   - **Estratégia**: Manter acesso à configuração manual via "Início Rápido"

2. **Preferências variadas**: Alguns usuários preferem ir direto para configuração
   - **Solução**: Cartão "Início Rápido" permanece acessível e destacado

3. **Histórico limitado**: Se usuário tem 100+ treinos, qual exibir?
   - **Decisão**: Sempre exibir o mais recente (timestamp descendente)

**Observações de Implementação:**

- Usar CategoryCard existente como base (já criado, não integrado)
- Aproveitar CategoryPresetsScreen existente
- HistoryContext já implementado em V8
- Componentes de animação (FadeInDown) já usados em ProfilesScreen
