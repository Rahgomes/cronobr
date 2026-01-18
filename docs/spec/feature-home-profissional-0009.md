# SPEC – Home Profissional: Hub de Modalidades
ID: feature-home-profissional-0009
Versão: V9.0
Baseado no PRD: /docs/prd/feature-home-profissional-0009.md

---

# 1. Arquitetura e Estratégia

## 1.1 Visão Geral

A V9 refatora a experiência de entrada do app, transformando a atual TimerConfigScreen em uma HomeScreen moderna com grid de modalidades. A estratégia arquitetural envolve:

1. **Criar nova HomeScreen** como ponto de entrada principal
2. **Mover configuração manual** para tela dedicada (ManualConfigScreen)
3. **Integrar CategoryCard** existente no grid de modalidades
4. **Criar componentes novos**: QuickStartCard, LastWorkoutCard
5. **Simplificar Drawer** removendo navegação de treinos
6. **Aproveitar infraestrutura existente**: CategoryPresetsScreen, HistoryContext, i18n

## 1.2 Impacto na Navegação

**Fluxo Atual (V8):**
```
TimerConfigScreen (entrada)
  ├─> Drawer > Profiles > CategoryPresets
  ├─> Drawer > History
  └─> ActiveTimer
```

**Novo Fluxo (V9):**
```
HomeScreen (entrada - grid de modalidades)
  ├─> QuickStartCard > ManualConfigScreen > ActiveTimer
  ├─> ModalityCard > CategoryPresetsScreen > ActiveTimer
  ├─> LastWorkoutCard > ActiveTimer (direto)
  └─> Drawer (minimalista)
        ├─> History
        ├─> Settings
        └─> About
```

## 1.3 Componentes Reutilizáveis

- ✅ **CategoryCard**: Já existe em `/components`, será integrado na Home
- ✅ **CategoryPresetsScreen**: Já existe, será destino dos ModalityCards
- ✅ **HistoryContext**: Já implementado em V8, fornece último treino
- ✅ **ConfirmationModal**: Reutilizar para confirmações se necessário
- 🆕 **QuickStartCard**: Novo, para configuração manual rápida
- 🆕 **LastWorkoutCard**: Novo, exibe último treino do histórico
- 🆕 **HomeScreen**: Nova tela principal

---

# 2. Arquivos Envolvidos

## 2.1 Criar (Novos Arquivos)

### Componentes
- `client/components/QuickStartCard.tsx` - Cartão de início rápido
- `client/components/LastWorkoutCard.tsx` - Cartão do último treino
- `client/components/ModalityCard.tsx` - Wrapper do CategoryCard com lógica de navegação

### Telas
- `client/screens/HomeScreen.tsx` - Nova tela principal com grid de modalidades
- `client/screens/ManualConfigScreen.tsx` - Configuração manual (migração do TimerConfigScreen)

## 2.2 Modificar (Arquivos Existentes)

### Navegação
- `client/navigation/RootStackNavigator.tsx`
  - Adicionar route `Home`
  - Adicionar route `ManualConfig`
  - Ajustar initialRouteName para `Home`
  - Atualizar RootStackParamList

### i18n
- `client/lib/i18n.ts`
  - Adicionar seção `home` com strings para modalidades
  - Adicionar traduções para cartões especiais
  - Traduzir descrições de modalidades (4 idiomas)

### Telas Existentes
- `client/screens/TimerConfigScreen.tsx`
  - Refatorar para ManualConfigScreen
  - Remover lógica de drawer (mover para HomeScreen)
  - Simplificar como tela de configuração pura

### App Root
- `client/App.tsx`
  - Garantir que HistoryProvider está ativo (já está em V8)

## 2.3 Integrar (Arquivos Já Criados mas Não Usados)

- `client/components/CategoryCard.tsx`
  - Já existe desde V8
  - Será usado no grid da HomeScreen

---

# 3. Tipos / Interfaces TypeScript

## 3.1 Tipos de Modalidade

```ts
// Já existe em storage.ts
export type WorkoutCategory = "EMOM" | "AMRAP" | "HIIT" | "TABATA" | "BOXE" | "CIRCUITO";

// Novo: Tipo estendido para modalidades da Home
export type ModalityType =
  | "HIIT"
  | "TABATA"
  | "EMOM"
  | "AMRAP"
  | "BOXE"
  | "MOBILIDADE"; // Nova modalidade visual (mapeia para CIRCUITO internamente)
```

## 3.2 Interface de Modalidade

```ts
// client/types/modality.ts (novo arquivo)
export interface Modality {
  id: string;
  category: WorkoutCategory; // Categoria interna do sistema
  displayName: string; // Nome traduzido (ex: "HIIT / Funcional")
  technicalName: string; // Nome técnico em caps (ex: "HIIT")
  description: string; // Descrição curta traduzida
  icon: keyof typeof Ionicons.glyphMap;
  color: string; // Cor hex específica da modalidade
}
```

## 3.3 Props de Componentes

```ts
// QuickStartCard.tsx
interface QuickStartCardProps {
  onPress: () => void;
}

// LastWorkoutCard.tsx
interface LastWorkoutCardProps {
  entry: WorkoutHistoryEntry;
  onRepeat: () => void;
}

// ModalityCard.tsx
interface ModalityCardProps {
  modality: Modality;
  onPress: (category: WorkoutCategory) => void;
  index: number; // Para animação delay
}
```

## 3.4 Navigation Types

```ts
// RootStackParamList (adicionar em RootStackNavigator.tsx)
export type RootStackParamList = {
  // Novo
  Home: undefined;
  ManualConfig: undefined;

  // Existentes
  TimerConfig: undefined; // Manter para compatibilidade ou deprecar
  ActiveTimer: {
    prepTime: number;
    exerciseTime: number;
    restTime: number;
    rounds: number;
    workoutType?: "preset" | "manual";
    presetName?: string;
    presetCategory?: WorkoutCategory;
  };
  CategoryPresets: { category: WorkoutCategory };
  History: undefined;
  Settings: undefined;
  // ... outras rotas
};
```

---

# 4. Detalhamento da Implementação

## 4.1 HomeScreen - Estrutura Principal

### Layout
```tsx
<SafeAreaView>
  <ScrollView>
    {/* Header */}
    <View style={styles.header}>
      <ThemedText type="h1">CronôBR</ThemedText>
      <ThemedText type="body">{t("home.subtitle")}</ThemedText>
    </View>

    {/* Quick Start Card (sempre visível) */}
    <QuickStartCard onPress={handleQuickStart} />

    {/* Last Workout Card (condicional) */}
    {lastWorkout && (
      <LastWorkoutCard
        entry={lastWorkout}
        onRepeat={handleRepeatWorkout}
      />
    )}

    {/* Modalities Section */}
    <ThemedText type="h2">{t("home.modalities")}</ThemedText>

    {/* Grid de Modalidades (2 colunas) */}
    <View style={styles.grid}>
      {modalities.map((modality, index) => (
        <ModalityCard
          key={modality.id}
          modality={modality}
          onPress={handleModalityPress}
          index={index}
        />
      ))}
    </View>
  </ScrollView>
</SafeAreaView>
```

### Lógica de Dados
```tsx
const HomeScreen = () => {
  const { history } = useHistory(); // HistoryContext (V8)
  const navigation = useNavigation();
  const { t } = useI18n();

  // Último treino (mais recente por timestamp)
  const lastWorkout = useMemo(() => {
    if (history.length === 0) return null;
    return history.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    )[0];
  }, [history]);

  // Definição de modalidades
  const modalities: Modality[] = [
    {
      id: "hiit",
      category: "HIIT",
      displayName: t("home.modalities.hiit.name"),
      technicalName: "HIIT",
      description: t("home.modalities.hiit.description"),
      icon: "flame-outline",
      color: "#F44336", // Red
    },
    {
      id: "tabata",
      category: "TABATA",
      displayName: t("home.modalities.tabata.name"),
      technicalName: "TABATA",
      description: t("home.modalities.tabata.description"),
      icon: "repeat-outline",
      color: "#2196F3", // Blue
    },
    {
      id: "emom",
      category: "EMOM",
      displayName: t("home.modalities.emom.name"),
      technicalName: "EMOM",
      description: t("home.modalities.emom.description"),
      icon: "time-outline",
      color: "#FFC107", // Amber
    },
    {
      id: "amrap",
      category: "AMRAP",
      displayName: t("home.modalities.amrap.name"),
      technicalName: "AMRAP",
      description: t("home.modalities.amrap.description"),
      icon: "flash-outline",
      color: "#FF6B35", // Orange (primary)
    },
    {
      id: "boxe",
      category: "BOXE",
      displayName: t("home.modalities.boxe.name"),
      technicalName: "BOXE",
      description: t("home.modalities.boxe.description"),
      icon: "fitness-outline",
      color: "#9C27B0", // Purple
    },
    {
      id: "mobilidade",
      category: "CIRCUITO", // Mapeia internamente para CIRCUITO
      displayName: t("home.modalities.mobilidade.name"),
      technicalName: "MOBILIDADE",
      description: t("home.modalities.mobilidade.description"),
      icon: "body-outline",
      color: "#4CAF50", // Green
    },
  ];

  const handleQuickStart = () => {
    navigation.navigate("ManualConfig");
  };

  const handleModalityPress = (category: WorkoutCategory) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate("CategoryPresets", { category });
  };

  const handleRepeatWorkout = async () => {
    if (!lastWorkout) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Navegar para ActiveTimer com config do último treino
    navigation.navigate("ActiveTimer", {
      prepTime: lastWorkout.config.prepTime,
      exerciseTime: lastWorkout.config.exerciseTime,
      restTime: lastWorkout.config.restTime,
      rounds: lastWorkout.config.rounds,
      workoutType: lastWorkout.type,
      presetName: lastWorkout.presetName,
      presetCategory: lastWorkout.presetCategory,
    });
  };

  return (
    // JSX acima
  );
};
```

### Estilos
```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: "center",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.l,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.m,
    marginTop: Spacing.m,
  },
});
```

---

## 4.2 QuickStartCard - Componente

### Estrutura
```tsx
export default function QuickStartCard({ onPress }: QuickStartCardProps) {
  const { theme } = useTheme();
  const { t } = useI18n();

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: Colors.primary,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="rocket-outline" size={32} color="#FFFFFF" />
        </View>

        <View style={styles.content}>
          <ThemedText
            type="h2"
            style={{ color: "#FFFFFF" }}
          >
            {t("home.quickStart.title")}
          </ThemedText>
          <ThemedText
            type="bodySmall"
            style={{ color: "#FFFFFF", opacity: 0.9 }}
          >
            {t("home.quickStart.description")}
          </ThemedText>
        </View>

        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    marginBottom: Spacing.m,
    minHeight: 80,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.s,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.m,
  },
  content: {
    flex: 1,
  },
});
```

---

## 4.3 LastWorkoutCard - Componente

### Estrutura
```tsx
export default function LastWorkoutCard({
  entry,
  onRepeat
}: LastWorkoutCardProps) {
  const { theme } = useTheme();
  const { t, language } = useI18n();

  const workoutName = entry.type === 'preset' && entry.presetName
    ? entry.presetName
    : t('home.lastWorkout.manual');

  const statusColor = entry.wasInterrupted ? Colors.warning : Colors.success;
  const statusText = entry.wasInterrupted
    ? t('home.lastWorkout.interrupted')
    : t('home.lastWorkout.completed');

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(300)}>
      <View style={[
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border
        }
      ]}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {t("home.lastWorkout.title")}
          </ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
            <ThemedText type="caption" style={{ color: statusColor }}>
              {statusText}
            </ThemedText>
          </View>
        </View>

        {/* Workout Info */}
        <ThemedText type="h3" style={{ marginBottom: Spacing.xs }}>
          {workoutName}
        </ThemedText>

        {/* Metadata Row */}
        <View style={styles.metadataRow}>
          <View style={styles.metadataItem}>
            <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
            <ThemedText type="bodySmall" style={{ color: theme.textSecondary }}>
              {formatDuration(entry.duration)}
            </ThemedText>
          </View>

          <View style={styles.metadataItem}>
            <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
            <ThemedText type="bodySmall" style={{ color: theme.textSecondary }}>
              {formatDate(entry.date, language)}
            </ThemedText>
          </View>

          {entry.presetCategory && (
            <View style={styles.metadataItem}>
              <Ionicons name="bookmark-outline" size={16} color={theme.textSecondary} />
              <ThemedText type="bodySmall" style={{ color: theme.textSecondary }}>
                {entry.presetCategory}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Repeat Button */}
        <Pressable
          onPress={onRepeat}
          style={({ pressed }) => [
            styles.repeatButton,
            {
              backgroundColor: Colors.primary,
              opacity: pressed ? 0.9 : 1
            }
          ]}
        >
          <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
          <ThemedText type="button" style={{ color: "#FFFFFF", marginLeft: Spacing.s }}>
            {t("home.lastWorkout.repeat")}
          </ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.m,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    marginBottom: Spacing.m,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  statusBadge: {
    paddingHorizontal: Spacing.s,
    paddingVertical: 4,
    borderRadius: BorderRadius.s,
  },
  metadataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.m,
    marginBottom: Spacing.m,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  repeatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.m,
    borderRadius: BorderRadius.s,
  },
});
```

---

## 4.4 ModalityCard - Componente

### Implementação
```tsx
// Wrapper do CategoryCard existente com animação e navegação
import CategoryCard from "./CategoryCard";
import Animated, { FadeInDown } from "react-native-reanimated";

interface ModalityCardProps {
  modality: Modality;
  onPress: (category: WorkoutCategory) => void;
  index: number;
}

export default function ModalityCard({
  modality,
  onPress,
  index
}: ModalityCardProps) {
  const { t } = useI18n();

  const handlePress = () => {
    onPress(modality.category);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(300)}
      style={{ flex: 1, minWidth: '45%', maxWidth: '50%' }}
    >
      <View style={styles.cardWrapper}>
        {/* Ícone Grande */}
        <View style={[
          styles.iconContainer,
          { backgroundColor: modality.color + "20" }
        ]}>
          <Ionicons
            name={modality.icon}
            size={48}
            color={modality.color}
          />
        </View>

        {/* Conteúdo */}
        <View style={styles.content}>
          <ThemedText type="caption" style={styles.technicalName}>
            {modality.technicalName}
          </ThemedText>
          <ThemedText type="h3" style={styles.displayName} numberOfLines={1}>
            {modality.displayName}
          </ThemedText>
          <ThemedText
            type="bodySmall"
            style={styles.description}
            numberOfLines={2}
          >
            {modality.description}
          </ThemedText>
        </View>

        {/* Press Handler */}
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.pressable,
            { opacity: pressed ? 0.7 : 1 }
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.m,
    borderWidth: 1,
    borderColor: theme.border,
    padding: Spacing.m,
    minHeight: 200,
    position: "relative",
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.m,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.m,
  },
  content: {
    flex: 1,
  },
  technicalName: {
    color: theme.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  displayName: {
    marginBottom: Spacing.xs,
  },
  description: {
    color: theme.textSecondary,
  },
  pressable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
```

---

## 4.5 ManualConfigScreen - Refatoração

### Estratégia
1. Copiar lógica de TimerConfigScreen
2. Remover lógica de Drawer (fica na HomeScreen)
3. Simplificar como tela de configuração pura
4. Manter apenas: ConfigCards, TimePickerModal, RoundsPickerModal, Botão Start

### Estrutura Simplificada
```tsx
export default function ManualConfigScreen() {
  const [config, setConfig] = useState<TimerConfig>({
    prepTime: 10,
    exerciseTime: 20,
    restTime: 10,
    rounds: 8,
  });
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // ... lógica de configuração (mantida do TimerConfigScreen)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <ScrollView>
        {/* Total Time Card */}
        <Card title={t("timerConfig.estimatedTime")}>
          <ThemedText type="h1">{formatTime(totalTime)}</ThemedText>
        </Card>

        {/* Config Cards */}
        <View style={styles.cardsContainer}>
          <ConfigCard
            icon="timer-outline"
            label={t("timerConfig.preparation")}
            value={formatTime(config.prepTime)}
            onPress={() => setActiveModal("prep")}
          />
          <ConfigCard
            icon="fitness-outline"
            label={t("timerConfig.exercise")}
            value={formatTime(config.exerciseTime)}
            onPress={() => setActiveModal("exercise")}
          />
          <ConfigCard
            icon="pause-outline"
            label={t("timerConfig.rest")}
            value={formatTime(config.restTime)}
            onPress={() => setActiveModal("rest")}
          />
          <ConfigCard
            icon="repeat-outline"
            label={t("timerConfig.rounds")}
            value={`${config.rounds}x`}
            onPress={() => setActiveModal("rounds")}
          />
        </View>

        {/* Start Button */}
        <Button onPress={handleStart}>
          {t("common.start")}
        </Button>
      </ScrollView>

      {/* Modals */}
      <TimePickerModal /* ... */ />
      <RoundsPickerModal /* ... */ />
    </SafeAreaView>
  );
}
```

---

## 4.6 Simplificação do Drawer

### Atualizar MenuDrawer em HomeScreen

**Drawer Items Novo Array:**
```tsx
const menuItems = [
  {
    key: "History" as const,
    icon: "clock" as const,
    label: t("menu.history")
  },
  {
    key: "Settings" as const,
    icon: "settings" as const,
    label: t("menu.settings")
  },
  {
    key: "SoundSettings" as const,
    icon: "volume-2" as const,
    label: t("menu.soundSettings")
  },
  {
    key: "About" as const,
    icon: "info" as const,
    label: t("menu.about")
  },
];

// Remover: Profiles, Preview
```

**Tipo de Navegação:**
```tsx
onNavigate: (screen: "History" | "Settings" | "SoundSettings" | "About") => void;
```

---

# 5. Pseudocódigo (Essência do Comportamento)

## HomeScreen
```
onMount:
  loadHistoryFromContext()
  determineLastWorkout()
  setupModalities()

onQuickStartPress:
  hapticFeedback(Medium)
  navigate("ManualConfig")

onModalityPress(category):
  hapticFeedback(Medium)
  navigate("CategoryPresets", { category })

onRepeatWorkout:
  hapticFeedback(Medium)
  extractConfigFromLastWorkout()
  navigate("ActiveTimer", { config })
```

## QuickStartCard
```
render:
  AnimatedView(FadeInDown)
  Pressable(onPress -> emit event)
  Icon(rocket) + Title + Description + Chevron
```

## LastWorkoutCard
```
render:
  if historyEmpty: return null
  AnimatedView(FadeInDown delay 100ms)
  Display: name, duration, date, category
  RepeatButton(onPress -> emit event)
```

## ModalityCard
```
render:
  AnimatedView(FadeInDown delay index*100ms)
  Icon(colored, 48px)
  TechnicalName(caps, small)
  DisplayName(h3)
  Description(bodySmall, 2 lines max)
  Pressable(overlay, onPress -> emit event)
```

---

# 6. Novas Strings no i18n

## 6.1 Português (pt-BR)
```typescript
home: {
  subtitle: "Escolha sua modalidade de treino",

  quickStart: {
    title: "Início Rápido",
    description: "Configure seu treino manualmente",
  },

  lastWorkout: {
    title: "Último Treino",
    manual: "Treino Manual",
    completed: "Concluído",
    interrupted: "Interrompido",
    repeat: "Repetir Treino",
  },

  modalities: "Modalidades",

  modalities: {
    hiit: {
      name: "HIIT / Funcional",
      description: "Alta intensidade em ciclos curtos",
    },
    tabata: {
      name: "Tabata Clássico",
      description: "20s de esforço, 10s de descanso",
    },
    emom: {
      name: "EMOM",
      description: "Um exercício a cada minuto",
    },
    amrap: {
      name: "AMRAP",
      description: "Máximo de repetições possível",
    },
    boxe: {
      name: "Boxe / Rounds",
      description: "Rounds de luta com intervalos",
    },
    mobilidade: {
      name: "Mobilidade",
      description: "Aquecimento e alongamento",
    },
  },
},

menu: {
  history: "Histórico de Treinos",
  settings: "Configurações",
  soundSettings: "Som e Narração",
  about: "Sobre",
},
```

## 6.2 Inglês (en)
```typescript
home: {
  subtitle: "Choose your workout modality",

  quickStart: {
    title: "Quick Start",
    description: "Configure your workout manually",
  },

  lastWorkout: {
    title: "Last Workout",
    manual: "Manual Workout",
    completed: "Completed",
    interrupted: "Interrupted",
    repeat: "Repeat Workout",
  },

  modalities: "Modalities",

  modalities: {
    hiit: {
      name: "HIIT / Functional",
      description: "High intensity in short cycles",
    },
    tabata: {
      name: "Classic Tabata",
      description: "20s work, 10s rest",
    },
    emom: {
      name: "EMOM",
      description: "Every minute on the minute",
    },
    amrap: {
      name: "AMRAP",
      description: "As many reps as possible",
    },
    boxe: {
      name: "Boxing / Rounds",
      description: "Fight rounds with intervals",
    },
    mobilidade: {
      name: "Mobility",
      description: "Warm-up and stretching",
    },
  },
},

menu: {
  history: "Workout History",
  settings: "Settings",
  soundSettings: "Sound & Narration",
  about: "About",
},
```

## 6.3 Espanhol (es)
```typescript
home: {
  subtitle: "Elige tu modalidad de entrenamiento",

  quickStart: {
    title: "Inicio Rápido",
    description: "Configura tu entrenamiento manualmente",
  },

  lastWorkout: {
    title: "Último Entrenamiento",
    manual: "Entrenamiento Manual",
    completed: "Completado",
    interrupted: "Interrumpido",
    repeat: "Repetir Entrenamiento",
  },

  modalities: "Modalidades",

  modalities: {
    hiit: {
      name: "HIIT / Funcional",
      description: "Alta intensidad en ciclos cortos",
    },
    tabata: {
      name: "Tabata Clásico",
      description: "20s de esfuerzo, 10s de descanso",
    },
    emom: {
      name: "EMOM",
      description: "Un ejercicio cada minuto",
    },
    amrap: {
      name: "AMRAP",
      description: "Máximo de repeticiones posible",
    },
    boxe: {
      name: "Boxeo / Asaltos",
      description: "Asaltos de pelea con intervalos",
    },
    mobilidade: {
      name: "Movilidad",
      description: "Calentamiento y estiramiento",
    },
  },
},

menu: {
  history: "Historial de Entrenamientos",
  settings: "Configuración",
  soundSettings: "Sonido y Narración",
  about: "Acerca de",
},
```

## 6.4 Francês (fr)
```typescript
home: {
  subtitle: "Choisissez votre modalité d'entraînement",

  quickStart: {
    title: "Démarrage Rapide",
    description: "Configurez votre entraînement manuellement",
  },

  lastWorkout: {
    title: "Dernier Entraînement",
    manual: "Entraînement Manuel",
    completed: "Terminé",
    interrupted: "Interrompu",
    repeat: "Répéter l'Entraînement",
  },

  modalities: "Modalités",

  modalities: {
    hiit: {
      name: "HIIT / Fonctionnel",
      description: "Haute intensité en cycles courts",
    },
    tabata: {
      name: "Tabata Classique",
      description: "20s d'effort, 10s de repos",
    },
    emom: {
      name: "EMOM",
      description: "Un exercice chaque minute",
    },
    amrap: {
      name: "AMRAP",
      description: "Maximum de répétitions possible",
    },
    boxe: {
      name: "Boxe / Rounds",
      description: "Rounds de combat avec intervalles",
    },
    mobilidade: {
      name: "Mobilité",
      description: "Échauffement et étirement",
    },
  },
},

menu: {
  history: "Historique des Entraînements",
  settings: "Paramètres",
  soundSettings: "Son et Narration",
  about: "À propos",
},
```

---

# 7. Testes Recomendados

## 7.1 Unit Tests

**HomeScreen:**
- [ ] `modalities array` retorna 6 modalidades
- [ ] `lastWorkout` é null se histórico vazio
- [ ] `lastWorkout` retorna treino mais recente se histórico existe
- [ ] `handleModalityPress` navega corretamente para CategoryPresets

**QuickStartCard:**
- [ ] Renderiza título e descrição traduzidos
- [ ] `onPress` callback é chamado ao tocar

**LastWorkoutCard:**
- [ ] Não renderiza se `entry` é null
- [ ] Exibe nome correto para preset vs manual
- [ ] Exibe status "Concluído" vs "Interrompido" corretamente
- [ ] `onRepeat` callback é chamado ao tocar botão

**ModalityCard:**
- [ ] Renderiza ícone, cor e textos corretos
- [ ] Animação delay calculado corretamente (index * 100)
- [ ] `onPress` callback é chamado com categoria correta

## 7.2 Integration Tests

**Fluxo de Navegação:**
- [ ] Home → QuickStart → ManualConfig (navegação funciona)
- [ ] Home → ModalityCard → CategoryPresets (categoria passada corretamente)
- [ ] Home → LastWorkout Repeat → ActiveTimer (config passado corretamente)
- [ ] Home → Drawer → History (navegação funciona)

**i18n:**
- [ ] Mudança de idioma atualiza todos os textos da Home
- [ ] Descrições de modalidades traduzidas corretamente (4 idiomas)

**HistoryContext Integration:**
- [ ] LastWorkoutCard aparece quando histórico não vazio
- [ ] LastWorkoutCard desaparece quando histórico é limpo
- [ ] Dados do último treino são lidos corretamente do contexto

## 7.3 Visual Regression Tests

- [ ] Grid de modalidades responsivo (2 colunas em smartphone)
- [ ] Cartões têm espaçamento correto
- [ ] Animações executam suavemente sem travamentos
- [ ] Tema claro exibe cores corretas
- [ ] Tema escuro exibe cores corretas

---

# 8. Checklist Técnico

## Código
- [ ] 100% tipado (sem `any`)
- [ ] Sem warnings no console
- [ ] Imports organizados (sem barrel exports)
- [ ] Componentes com props interfaces bem definidas

## i18n
- [ ] Todas as strings em `i18n.ts`
- [ ] 4 idiomas completos (PT-BR, EN, ES, FR)
- [ ] Nenhum texto hardcoded
- [ ] Traduções revisadas por falantes nativos (se possível)

## Performance
- [ ] Animações a 60fps
- [ ] Renderização inicial < 300ms
- [ ] Sem re-renders desnecessários
- [ ] useMemo/useCallback onde apropriado

## Acessibilidade
- [ ] Todos os cartões com min-height 48dp
- [ ] Contraste de cores suficiente
- [ ] Textos legíveis em diferentes tamanhos de tela

## Persistência
- [ ] HistoryContext integrado
- [ ] Último treino lido corretamente
- [ ] Navegação mantém estado ao voltar

## Temas
- [ ] Todos os componentes usam `useTheme()` hook
- [ ] Cores dinâmicas (light/dark)
- [ ] Transição suave entre temas

## Navegação
- [ ] RootStackParamList atualizado
- [ ] Todas as rotas tipadas
- [ ] initialRouteName = "Home"
- [ ] Nenhum navigation warning

---

# 9. Observações Finais

## 9.1 Compatibilidade com Versões Futuras

A HomeScreen foi projetada para acomodar facilmente:

- **V10 (Calendário)**: Adicionar cartão "Próximo Treino Agendado" abaixo de "Último Treino"
- **V11 (Estatísticas)**: Adicionar cartão "Progresso Semanal" ou "Metas"
- **V12+ (Favoritos)**: Badge de estrela em modalidades favoritas

## 9.2 Performance Considerations

- Limite de 6 modalidades garante que grid seja rápido mesmo em dispositivos antigos
- Animações FadeInDown são leves (apenas opacity + translateY)
- HistoryContext já otimizado em V8 (não recarrega a cada render)

## 9.3 Feedback de Usuário

Considerar adicionar em versões futuras:
- Tutorial interativo na primeira abertura
- Dicas contextuais (tooltips)
- Onboarding step-by-step

## 9.4 A/B Testing Suggestions

Após lançamento, testar:
- Ordem das modalidades no grid (qual recebe mais cliques)
- Posicionamento do "Início Rápido" (topo vs rodapé)
- Cores das modalidades (impacto na conversão)

## 9.5 Analytics Tracking (fora do escopo mas recomendado)

Se analytics forem adicionados futuramente, trackear:
- Modalidade mais acessada
- Taxa de uso "Início Rápido" vs Modalidades
- Taxa de repetição de último treino
- Tempo médio na HomeScreen antes de iniciar treino
