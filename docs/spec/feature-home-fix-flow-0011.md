# SPEC: Correção de Fluxo de Navegação V9.2
**Feature ID:** feature-home-fix-flow-0011
**Version:** V9.2
**Date:** 2026-01-18
**Status:** Draft
**Related PRD:** [feature-home-fix-flow-0011.md](../prd/feature-home-fix-flow-0011.md)

---

## 1. ARQUITETURA GERAL

### 1.1 Visão Geral
Esta especificação detalha as mudanças técnicas necessárias para corrigir as regressões de navegação introduzidas na V9.0/V9.1, restaurando o fluxo completo de configuração de treinos.

### 1.2 Componentes Afetados

```
client/
├─ components/
│  └─ MenuDrawer.tsx                    [NOVO - Extraído de TimerConfigScreen]
│
├─ navigation/
│  └─ RootStackNavigator.tsx           [MODIFICADO - Atualizar types]
│
├─ screens/
│  ├─ HomeScreen.tsx                   [MODIFICADO - Adicionar menu + MenuDrawer]
│  ├─ ManualConfigScreen.tsx           [MODIFICADO - Adicionar menu + aceitar preset]
│  ├─ CategoryPresetsScreen.tsx        [MODIFICADO - Navegar para ManualConfig]
│  └─ TimerConfigScreen.tsx            [MODIFICADO - Usar MenuDrawer compartilhado]
│
└─ lib/
   └─ i18n.ts                          [MODIFICADO - Adicionar chaves faltando]
```

---

## 2. TIPOS E INTERFACES

### 2.1 RootStackParamList (Atualizado)

**Arquivo:** `client/navigation/RootStackNavigator.tsx`

```typescript
// ===== NOVO TYPE =====
export type PresetConfig = {
  prepTime: number;
  exerciseTime: number;
  restTime: number;
  rounds: number;
  presetName?: string;
  category?: WorkoutCategory;
};

// ===== ATUALIZAÇÃO =====
export type RootStackParamList = {
  Home: undefined;

  // ANTES: ManualConfig: undefined;
  // DEPOIS:
  ManualConfig: { preset?: PresetConfig };  // ← PERMITE PRESET OPCIONAL

  TimerConfig: undefined;

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

  Settings: undefined;
  Profile: undefined;
  SoundSettings: undefined;
  AdvancedSettings: undefined;
  WorkoutPreview: {
    prepTime: number;
    exerciseTime: number;
    restTime: number;
    rounds: number;
  };
  Profiles: undefined;
  DynamicPreview: {
    prepTime: number;
    exerciseTime: number;
    restTime: number;
    rounds: number;
  };
  History: undefined;
  HistoryDetail: { workoutId: string };
  About: undefined;
};
```

---

### 2.2 WorkoutProfile (Já existente - referência)

**Arquivo:** `client/lib/storage.ts`

```typescript
export interface WorkoutProfile {
  id: string;
  name: string;
  category: WorkoutCategory;
  config: TimerConfig;
  createdAt: string;
  updatedAt: string;
}

export interface TimerConfig {
  prepTime: number;
  exerciseTime: number;
  restTime: number;
  rounds: number;
}

export type WorkoutCategory =
  | "hiit"
  | "tabata"
  | "amrap"
  | "emom"
  | "fortime"
  | "custom";
```

---

### 2.3 MenuDrawerProps (Novo)

**Arquivo:** `client/components/MenuDrawer.tsx`

```typescript
import { NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootStackNavigator";

export type MenuScreen = "Profiles" | "History" | "SoundSettings" | "AdvancedSettings";

export interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  navigation: NavigationProp<RootStackParamList>;
}
```

---

## 3. COMPONENTES

### 3.1 MenuDrawer (Novo Componente Compartilhado)

**Arquivo:** `client/components/MenuDrawer.tsx`

#### 3.1.1 Estrutura do Componente

```typescript
import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useTheme } from "../contexts/ThemeContext";
import { useI18n } from "../contexts/I18nContext";
import { Colors } from "../constants/Colors";
import { NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/RootStackNavigator";

export type MenuScreen = "Profiles" | "History" | "SoundSettings" | "AdvancedSettings";

export interface MenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  navigation: NavigationProp<RootStackParamList>;
}

export default function MenuDrawer({
  visible,
  onClose,
  navigation,
}: MenuDrawerProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const slideAnim = React.useRef(new Animated.Value(-300)).current;

  // ===== ANIMATION =====
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 300,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // ===== MENU ITEMS =====
  const menuItems = [
    {
      key: "Profiles" as const,
      icon: "folder" as const,
      label: t("menu.profiles"),
    },
    {
      key: "History" as const,
      icon: "clock" as const,
      label: t("menu.history"),
    },
    {
      key: "SoundSettings" as const,
      icon: "volume-2" as const,
      label: t("menu.soundSettings"),
    },
    {
      key: "AdvancedSettings" as const,
      icon: "settings" as const,
      label: t("menu.advancedSettings"),
    },
  ];

  // ===== HANDLERS =====
  const handleNavigate = (screen: MenuScreen) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
    navigation.navigate(screen);
  };

  const handleBackdropPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  if (!visible) return null;

  // ===== RENDER =====
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={handleBackdropPress}
      >
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <BlurView
            intensity={80}
            tint={theme.name === "dark" ? "dark" : "light"}
            style={styles.blurContainer}
          >
            <View
              style={[
                styles.content,
                { backgroundColor: theme.backgroundCard + "E6" },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>
                  {t("menu.title")}
                </Text>
                <Pressable
                  onPress={handleBackdropPress}
                  style={({ pressed }) => [
                    styles.closeButton,
                    {
                      backgroundColor: pressed
                        ? Colors.primary + "20"
                        : "transparent",
                    },
                  ]}
                >
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              {/* Menu Items */}
              <View style={styles.menuItems}>
                {menuItems.map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => handleNavigate(item.key)}
                    style={({ pressed }) => [
                      styles.menuItem,
                      {
                        backgroundColor: pressed
                          ? Colors.primary + "20"
                          : "transparent",
                      },
                    ]}
                  >
                    <Feather
                      name={item.icon}
                      size={20}
                      color={Colors.primary}
                    />
                    <Text style={[styles.menuItemText, { color: theme.text }]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
  },
  drawer: {
    width: 280,
    height: "100%",
  },
  blurContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  menuItems: {
    gap: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
```

---

## 4. MODIFICAÇÕES EM ARQUIVOS EXISTENTES

### 4.1 HomeScreen.tsx

**Arquivo:** `client/screens/HomeScreen.tsx`

#### 4.1.1 Imports Adicionais

```typescript
// ADICIONAR ao topo do arquivo:
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "../constants/Colors";
import MenuDrawer from "../components/MenuDrawer";
import { Pressable, Platform } from "react-native";
```

#### 4.1.2 State para Menu

```typescript
// ADICIONAR ao componente HomeScreen:
export default function HomeScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { t } = useI18n();

  // ===== NOVO STATE =====
  const [menuVisible, setMenuVisible] = useState(false);

  // ... resto do código existente
```

#### 4.1.3 useLayoutEffect para Header Buttons

```typescript
// ADICIONAR após os states, antes dos handlers:
React.useLayoutEffect(() => {
  navigation.setOptions({
    headerLeft: () => (
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          setMenuVisible(true);
        }}
        style={({ pressed }) => ({
          padding: 8,
          marginLeft: 8,
          borderRadius: 8,
          backgroundColor: pressed ? Colors.primary + "20" : "transparent",
        })}
      >
        <Feather name="menu" size={24} color={theme.text} />
      </Pressable>
    ),
    headerRight: () => (
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          navigation.navigate("Settings");
        }}
        style={({ pressed }) => ({
          padding: 8,
          marginRight: 8,
          borderRadius: 8,
          backgroundColor: pressed ? Colors.primary + "20" : "transparent",
        })}
      >
        <Feather name="settings" size={24} color={theme.text} />
      </Pressable>
    ),
  });
}, [navigation, theme]);
```

#### 4.1.4 Adicionar MenuDrawer ao JSX

```typescript
// ADICIONAR no return, após o ScrollView:
return (
  <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
    <ScrollView {...existingProps}>
      {/* ... código existente ... */}
    </ScrollView>

    {/* ===== NOVO COMPONENTE ===== */}
    <MenuDrawer
      visible={menuVisible}
      onClose={() => setMenuVisible(false)}
      navigation={navigation}
    />
  </View>
);
```

---

### 4.2 ManualConfigScreen.tsx

**Arquivo:** `client/screens/ManualConfigScreen.tsx`

#### 4.2.1 Imports Adicionais

```typescript
// ADICIONAR ao topo:
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "../constants/Colors";
import MenuDrawer from "../components/MenuDrawer";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootStackNavigator";
```

#### 4.2.2 Atualizar Type Props

```typescript
// SUBSTITUIR:
// type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ManualConfig">;
// export default function ManualConfigScreen() {

// POR:
type Props = NativeStackScreenProps<RootStackParamList, "ManualConfig">;

export default function ManualConfigScreen({ navigation, route }: Props) {
```

#### 4.2.3 State para Menu

```typescript
// ADICIONAR ao componente:
export default function ManualConfigScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t, formatTime } = useI18n();

  // ===== NOVO STATE =====
  const [menuVisible, setMenuVisible] = useState(false);

  // ... resto do código existente
```

#### 4.2.4 Processar Preset de route.params

```typescript
// MODIFICAR o loadConfig existente:
const loadConfig = useCallback(async () => {
  // ===== NOVO: VERIFICAR SE RECEBEU PRESET =====
  if (route.params?.preset) {
    const { preset } = route.params;
    setConfig({
      prepTime: preset.prepTime,
      exerciseTime: preset.exerciseTime,
      restTime: preset.restTime,
      rounds: preset.rounds,
    });
    return; // ← Não carregar do storage se recebeu preset
  }

  // ===== CÓDIGO EXISTENTE: CARREGAR DO STORAGE =====
  const loadedConfig = await getTimerConfig();
  setConfig(loadedConfig);
}, [route.params]);

useEffect(() => {
  loadConfig();
}, [loadConfig]);
```

#### 4.2.5 useLayoutEffect para Header Buttons

```typescript
// ADICIONAR após loadConfig:
React.useLayoutEffect(() => {
  navigation.setOptions({
    headerLeft: () => (
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          setMenuVisible(true);
        }}
        style={({ pressed }) => ({
          padding: 8,
          marginLeft: 8,
          borderRadius: 8,
          backgroundColor: pressed ? Colors.primary + "20" : "transparent",
        })}
      >
        <Feather name="menu" size={24} color={theme.text} />
      </Pressable>
    ),
    headerRight: () => (
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          navigation.navigate("Settings");
        }}
        style={({ pressed }) => ({
          padding: 8,
          marginRight: 8,
          borderRadius: 8,
          backgroundColor: pressed ? Colors.primary + "20" : "transparent",
        })}
      >
        <Feather name="settings" size={24} color={theme.text} />
      </Pressable>
    ),
  });
}, [navigation, theme]);
```

#### 4.2.6 Adicionar MenuDrawer ao JSX

```typescript
// ADICIONAR no return, após o View com startButtonContainer:
return (
  <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
    <ScrollView {...existingProps}>
      {/* ... código existente ... */}
    </ScrollView>

    <View style={styles.startButtonContainer}>
      <Button onPress={handleStart} style={styles.startButton}>
        {t("common.start")}
      </Button>
    </View>

    {/* ===== NOVO COMPONENTE ===== */}
    <MenuDrawer
      visible={menuVisible}
      onClose={() => setMenuVisible(false)}
      navigation={navigation}
    />

    {/* ... modais existentes ... */}
  </View>
);
```

---

### 4.3 CategoryPresetsScreen.tsx

**Arquivo:** `client/screens/CategoryPresetsScreen.tsx`

#### 4.3.1 Modificar handleSelectProfile

```typescript
// SUBSTITUIR a função handleSelectProfile:

// ===== CÓDIGO ANTIGO (REMOVER) =====
// const handleSelectProfile = async (profile: WorkoutProfile) => {
//   if (Platform.OS !== "web") {
//     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//   }
//
//   await applyProfile(profile.id);
//
//   navigation.navigate('ActiveTimer', {
//     prepTime: profile.config.prepTime,
//     exerciseTime: profile.config.exerciseTime,
//     restTime: profile.config.restTime,
//     rounds: profile.config.rounds,
//     workoutType: 'preset',
//     presetName: profile.name,
//     presetCategory: profile.category,
//   });
// };

// ===== CÓDIGO NOVO (ADICIONAR) =====
const handleSelectProfile = async (profile: WorkoutProfile) => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  // Salva perfil como ativo (manter comportamento de salvar)
  await applyProfile(profile.id);

  // ===== MUDANÇA CRÍTICA: NAVEGAR PARA MANUALCONFIG =====
  navigation.navigate('ManualConfig', {
    preset: {
      prepTime: profile.config.prepTime,
      exerciseTime: profile.config.exerciseTime,
      restTime: profile.config.restTime,
      rounds: profile.config.rounds,
      presetName: profile.name,
      category: profile.category,
    },
  });
};
```

**Explicação:**
- Remove navegação direta para `ActiveTimer`
- Adiciona navegação para `ManualConfig` com parâmetro `preset`
- Mantém `applyProfile()` para salvar preset como ativo
- Permite usuário editar antes de iniciar

---

### 4.4 TimerConfigScreen.tsx (Refatoração)

**Arquivo:** `client/screens/TimerConfigScreen.tsx`

#### 4.4.1 Remover MenuDrawer Local

```typescript
// REMOVER a função MenuDrawer (linhas ~45-134):
// function MenuDrawer({ visible, onClose, onNavigate }: {...}) {
//   // ... todo o código do MenuDrawer
// }
```

#### 4.4.2 Importar MenuDrawer Compartilhado

```typescript
// ADICIONAR ao topo do arquivo:
import MenuDrawer from "../components/MenuDrawer";
```

#### 4.4.3 Remover handleMenuNavigate

```typescript
// REMOVER:
// const handleMenuNavigate = (screen: "SoundSettings" | "AdvancedSettings" | "Profiles" | "History") => {
//   setMenuVisible(false);
//   navigation.navigate(screen);
// };
```

#### 4.4.4 Atualizar uso do MenuDrawer

```typescript
// SUBSTITUIR o uso do MenuDrawer no JSX:

// ANTES:
// <MenuDrawer
//   visible={menuVisible}
//   onClose={() => setMenuVisible(false)}
//   onNavigate={handleMenuNavigate}
// />

// DEPOIS:
<MenuDrawer
  visible={menuVisible}
  onClose={() => setMenuVisible(false)}
  navigation={navigation}
/>
```

---

### 4.5 i18n.ts (Adicionar Chaves Faltando)

**Arquivo:** `client/lib/i18n.ts`

#### 4.5.1 Adicionar Chaves ao Português (pt-BR)

```typescript
// ADICIONAR ao objeto menu:
menu: {
  title: "Menu",                          // ← ADICIONAR
  history: "Histórico de Treinos",
  settings: "Configurações",
  soundSettings: "Configurações de Som",
  about: "Sobre",
  profiles: "Perfis de Treino",           // ← ADICIONAR
  advancedSettings: "Configurações Avançadas",  // ← ADICIONAR
},
```

#### 4.5.2 Adicionar Chaves ao Inglês (en)

```typescript
// ADICIONAR ao objeto menu:
menu: {
  title: "Menu",                          // ← ADICIONAR
  history: "Workout History",
  settings: "Settings",
  soundSettings: "Sound Settings",
  about: "About",
  profiles: "Workout Profiles",           // ← ADICIONAR
  advancedSettings: "Advanced Settings",  // ← ADICIONAR
},
```

#### 4.5.3 Adicionar Chaves ao Espanhol (es)

```typescript
// ADICIONAR ao objeto menu:
menu: {
  title: "Menú",                          // ← ADICIONAR
  history: "Historial de Entrenamientos",
  settings: "Configuración",
  soundSettings: "Configuración de Sonido",
  about: "Acerca de",
  profiles: "Perfiles de Entrenamiento",  // ← ADICIONAR
  advancedSettings: "Configuración Avanzada",  // ← ADICIONAR
},
```

#### 4.5.4 Adicionar Chaves ao Francês (fr)

```typescript
// ADICIONAR ao objeto menu:
menu: {
  title: "Menu",                          // ← ADICIONAR
  history: "Historique des Entraînements",
  settings: "Paramètres",
  soundSettings: "Paramètres Audio",
  about: "À Propos",
  profiles: "Profils d'Entraînement",     // ← ADICIONAR
  advancedSettings: "Paramètres Avancés", // ← ADICIONAR
},
```

---

## 5. FLUXOS DE DADOS

### 5.1 Fluxo: Início Rápido (QuickStart)

```
┌─────────────────┐
│   HomeScreen    │
│                 │
│ [QuickStart]    │ ← Usuário toca
└────────┬────────┘
         │
         │ navigation.navigate("ManualConfig", undefined)
         │
         ▼
┌─────────────────────┐
│ ManualConfigScreen  │
│                     │
│ route.params?.preset│ → undefined
│ loadConfig()        │ → Carrega do storage (getTimerConfig)
│                     │
│ config: {           │
│   prepTime: 10      │ ← Valores salvos
│   exerciseTime: 30  │
│   restTime: 15      │
│   rounds: 5         │
│ }                   │
│                     │
│ [Usuário edita]     │
│ [Toca "Iniciar"]    │ ← handleStart()
└────────┬────────────┘
         │
         │ navigation.navigate("ActiveTimer", {
         │   ...config,
         │   workoutType: "manual"
         │ })
         │
         ▼
┌─────────────────┐
│  ActiveTimer    │
│                 │
│ Timer inicia    │
└─────────────────┘
```

---

### 5.2 Fluxo: Selecionar Preset (Novo Comportamento)

```
┌─────────────────┐
│   HomeScreen    │
│                 │
│ [HIIT Card]     │ ← Usuário toca
└────────┬────────┘
         │
         │ navigation.navigate("CategoryPresets", {
         │   category: "hiit"
         │ })
         │
         ▼
┌─────────────────────────┐
│ CategoryPresetsScreen   │
│                         │
│ route.params.category   │ → "hiit"
│ loadProfiles()          │ → Carrega profiles de HIIT
│                         │
│ profiles: [             │
│   { name: "HIIT Intenso", config: {...} },
│   { name: "HIIT Moderado", config: {...} },
│   ...                   │
│ ]                       │
│                         │
│ [Usuário toca preset]   │ ← handleSelectProfile(profile)
└────────┬────────────────┘
         │
         │ await applyProfile(profile.id)  ← Salva como ativo
         │
         │ navigation.navigate("ManualConfig", {
         │   preset: {
         │     prepTime: 10,
         │     exerciseTime: 45,
         │     restTime: 15,
         │     rounds: 8,
         │     presetName: "HIIT Intenso",
         │     category: "hiit"
         │   }
         │ })
         │
         ▼
┌─────────────────────┐
│ ManualConfigScreen  │
│                     │
│ route.params?.preset│ → { prepTime: 10, ... }
│ loadConfig()        │ → Detecta preset
│                     │
│ config: {           │
│   prepTime: 10      │ ← Do preset
│   exerciseTime: 45  │ ← Do preset
│   restTime: 15      │ ← Do preset
│   rounds: 8         │ ← Do preset
│ }                   │
│                     │
│ [Usuário pode editar] ← Editável!
│ [Toca "Iniciar"]    │ ← handleStart()
└────────┬────────────┘
         │
         │ navigation.navigate("ActiveTimer", {
         │   ...config,  ← Valores editados (se houver)
         │   workoutType: "manual"
         │ })
         │
         ▼
┌─────────────────┐
│  ActiveTimer    │
│                 │
│ Timer inicia    │
└─────────────────┘
```

---

### 5.3 Fluxo: Menu Drawer

```
┌─────────────────┐
│   HomeScreen    │
│                 │
│ [Menu Button]   │ ← Usuário toca (headerLeft)
└────────┬────────┘
         │
         │ setMenuVisible(true)
         │
         ▼
┌─────────────────┐
│   MenuDrawer    │
│   (Modal)       │
│                 │
│ • Perfis        │
│ • Histórico     │ ← Usuário seleciona
│ • Config Som    │
│ • Config Avanç. │
└────────┬────────┘
         │
         │ handleNavigate("History")
         │ onClose()
         │ navigation.navigate("History")
         │
         ▼
┌─────────────────┐
│ HistoryScreen   │
│                 │
│ Lista treinos   │
└─────────────────┘
```

---

## 6. PSEUDOCÓDIGO DETALHADO

### 6.1 MenuDrawer.tsx

```
COMPONENT MenuDrawer(visible, onClose, navigation):

  // ===== SETUP =====
  theme ← useTheme()
  i18n ← useI18n()
  slideAnim ← useRef(new Animated.Value(-300))

  // ===== ANIMATION =====
  useEffect(() => {
    IF visible THEN:
      Animated.spring(slideAnim, { toValue: 0 })
    ELSE:
      Animated.timing(slideAnim, { toValue: -300 })
  }, [visible])

  // ===== MENU STRUCTURE =====
  menuItems ← [
    { key: "Profiles", icon: "folder", label: t("menu.profiles") },
    { key: "History", icon: "clock", label: t("menu.history") },
    { key: "SoundSettings", icon: "volume-2", label: t("menu.soundSettings") },
    { key: "AdvancedSettings", icon: "settings", label: t("menu.advancedSettings") }
  ]

  // ===== HANDLERS =====
  FUNCTION handleNavigate(screen):
    Haptics.impact()
    onClose()
    navigation.navigate(screen)

  FUNCTION handleBackdropPress():
    Haptics.impact()
    onClose()

  // ===== RENDER =====
  IF NOT visible THEN RETURN null

  RETURN (
    <Modal visible transparent>
      <Pressable onPress={handleBackdropPress}>  // Backdrop
        <Animated.View transform={slideAnim}>    // Sliding drawer
          <BlurView>
            <View>
              {/* Header com título e botão fechar */}

              {/* Menu items */}
              FOR EACH item IN menuItems:
                <Pressable onPress={() => handleNavigate(item.key)}>
                  <Icon name={item.icon} />
                  <Text>{item.label}</Text>
                </Pressable>
            </View>
          </BlurView>
        </Animated.View>
      </Pressable>
    </Modal>
  )
```

---

### 6.2 HomeScreen.tsx (Modificações)

```
COMPONENT HomeScreen(navigation, route):

  // ===== EXISTING CODE =====
  theme ← useTheme()
  i18n ← useI18n()
  modalities ← getModalities()

  // ===== NEW STATE =====
  [menuVisible, setMenuVisible] ← useState(false)

  // ===== NEW HEADER SETUP =====
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: <Pressable onPress={() => setMenuVisible(true)}>
                    <Icon name="menu" />
                  </Pressable>,
      headerRight: <Pressable onPress={() => navigation.navigate("Settings")}>
                     <Icon name="settings" />
                   </Pressable>
    })
  }, [navigation, theme])

  // ===== EXISTING HANDLERS =====
  FUNCTION handleQuickStart():
    navigation.navigate("ManualConfig")  // Sem parâmetros

  FUNCTION handleModalityPress(category):
    navigation.navigate("CategoryPresets", { category })

  // ===== RENDER =====
  RETURN (
    <View>
      <ScrollView>
        {/* QuickStartCardV2 */}
        {/* ModalidadeCardV2 grid */}
        {/* LastWorkoutCard */}
      </ScrollView>

      {/* ===== NEW COMPONENT ===== */}
      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />
    </View>
  )
```

---

### 6.3 ManualConfigScreen.tsx (Modificações)

```
COMPONENT ManualConfigScreen({ navigation, route }):

  // ===== EXISTING CODE =====
  theme ← useTheme()
  i18n ← useI18n()
  insets ← useSafeAreaInsets()

  // ===== NEW STATE =====
  [menuVisible, setMenuVisible] ← useState(false)

  // ===== EXISTING STATE =====
  [config, setConfig] ← useState({
    prepTime: 10,
    exerciseTime: 30,
    restTime: 15,
    rounds: 5
  })
  [activeModal, setActiveModal] ← useState(null)

  // ===== MODIFIED CONFIG LOADING =====
  FUNCTION loadConfig():
    // ===== NEW: CHECK FOR PRESET =====
    IF route.params?.preset EXISTS THEN:
      preset ← route.params.preset
      setConfig({
        prepTime: preset.prepTime,
        exerciseTime: preset.exerciseTime,
        restTime: preset.restTime,
        rounds: preset.rounds
      })
      RETURN  // Don't load from storage

    // ===== EXISTING: LOAD FROM STORAGE =====
    loadedConfig ← await getTimerConfig()
    setConfig(loadedConfig)

  useEffect(() => {
    loadConfig()
  }, [route.params])

  // ===== NEW HEADER SETUP =====
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: <Pressable onPress={() => setMenuVisible(true)}>
                    <Icon name="menu" />
                  </Pressable>,
      headerRight: <Pressable onPress={() => navigation.navigate("Settings")}>
                     <Icon name="settings" />
                   </Pressable>
    })
  }, [navigation, theme])

  // ===== EXISTING HANDLERS =====
  FUNCTION handleStart():
    navigation.navigate("ActiveTimer", {
      ...config,
      workoutType: "manual"
    })

  FUNCTION handleConfigChange(key, value):
    setConfig({ ...config, [key]: value })
    await saveTimerConfig(config)

  // ===== RENDER =====
  RETURN (
    <View>
      <ScrollView>
        {/* Hero section */}
        {/* Total time card */}
        {/* 4 ConfigCards */}
      </ScrollView>

      {/* Start button */}
      <Button onPress={handleStart}>Iniciar</Button>

      {/* ===== NEW COMPONENT ===== */}
      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />

      {/* Time picker modals */}
    </View>
  )
```

---

### 6.4 CategoryPresetsScreen.tsx (Modificações)

```
COMPONENT CategoryPresetsScreen({ navigation, route }):

  // ===== EXISTING CODE =====
  { category } ← route.params
  [profiles, setProfiles] ← useState([])

  FUNCTION loadProfiles():
    allProfiles ← await getWorkoutProfiles()
    categoryProfiles ← allProfiles.filter(p => p.category === category)
    setProfiles(categoryProfiles)

  useEffect(() => {
    loadProfiles()
  }, [category])

  // ===== MODIFIED HANDLER =====
  FUNCTION handleSelectProfile(profile):
    Haptics.impact()

    // Save profile as active (mantém comportamento)
    await applyProfile(profile.id)

    // ===== NEW NAVIGATION TARGET =====
    // ANTES: navigation.navigate('ActiveTimer', {...})
    // DEPOIS:
    navigation.navigate('ManualConfig', {
      preset: {
        prepTime: profile.config.prepTime,
        exerciseTime: profile.config.exerciseTime,
        restTime: profile.config.restTime,
        rounds: profile.config.rounds,
        presetName: profile.name,
        category: profile.category
      }
    })

  // ===== RENDER =====
  RETURN (
    <ScrollView>
      FOR EACH profile IN profiles:
        <Pressable onPress={() => handleSelectProfile(profile)}>
          <Text>{profile.name}</Text>
          <Text>Prep: {profile.config.prepTime}s</Text>
          <Text>Exerc: {profile.config.exerciseTime}s</Text>
          <Text>Desc: {profile.config.restTime}s</Text>
          <Text>{profile.config.rounds} rounds</Text>
        </Pressable>
    </ScrollView>
  )
```

---

## 7. TESTES

### 7.1 Testes Unitários

#### 7.1.1 MenuDrawer.test.tsx

```typescript
describe("MenuDrawer", () => {
  it("deve renderizar quando visible=true", () => {
    const { getByText } = render(
      <MenuDrawer visible={true} onClose={jest.fn()} navigation={mockNav} />
    );
    expect(getByText("Perfis de Treino")).toBeTruthy();
  });

  it("deve chamar onClose ao tocar no backdrop", () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <MenuDrawer visible={true} onClose={onClose} navigation={mockNav} />
    );
    fireEvent.press(getByTestId("backdrop"));
    expect(onClose).toHaveBeenCalled();
  });

  it("deve navegar ao selecionar item", () => {
    const mockNav = { navigate: jest.fn() };
    const { getByText } = render(
      <MenuDrawer visible={true} onClose={jest.fn()} navigation={mockNav} />
    );
    fireEvent.press(getByText("Histórico de Treinos"));
    expect(mockNav.navigate).toHaveBeenCalledWith("History");
  });
});
```

---

### 7.2 Testes de Integração

#### 7.2.1 Navigation Flow: Quick Start

```typescript
describe("Quick Start Flow", () => {
  it("deve navegar de Home → ManualConfig → ActiveTimer", async () => {
    const { getByText } = render(<AppNavigator />);

    // Toca em Início Rápido
    fireEvent.press(getByText("Início Rápido"));

    // Deve estar em ManualConfigScreen
    await waitFor(() => {
      expect(getByText("Configuração Manual")).toBeTruthy();
    });

    // Deve ter menu hambúrguer
    expect(getByTestId("header-left-button")).toBeTruthy();

    // Toca em Iniciar
    fireEvent.press(getByText("Iniciar"));

    // Deve estar em ActiveTimer
    await waitFor(() => {
      expect(getByTestId("active-timer")).toBeTruthy();
    });
  });
});
```

---

#### 7.2.2 Navigation Flow: Preset Selection

```typescript
describe("Preset Selection Flow", () => {
  it("deve navegar de Home → CategoryPresets → ManualConfig (preenchido) → ActiveTimer", async () => {
    const { getByText } = render(<AppNavigator />);

    // Toca em modalidade HIIT
    fireEvent.press(getByText("HIIT"));

    // Deve estar em CategoryPresetsScreen
    await waitFor(() => {
      expect(getByText(/presets de hiit/i)).toBeTruthy();
    });

    // Toca em preset "HIIT Intenso"
    fireEvent.press(getByText("HIIT Intenso"));

    // Deve estar em ManualConfigScreen
    await waitFor(() => {
      expect(getByText("Configuração Manual")).toBeTruthy();
    });

    // Campos devem estar preenchidos com valores do preset
    expect(getByText("45s")).toBeTruthy(); // Exercise time
    expect(getByText("15s")).toBeTruthy(); // Rest time
    expect(getByText("8x")).toBeTruthy();  // Rounds

    // Usuário pode editar
    fireEvent.press(getByText("45s"));
    // ... editar campo

    // Toca em Iniciar
    fireEvent.press(getByText("Iniciar"));

    // Deve estar em ActiveTimer
    await waitFor(() => {
      expect(getByTestId("active-timer")).toBeTruthy();
    });
  });
});
```

---

### 7.3 Testes de Regressão

```typescript
describe("V9.2 Regression Tests", () => {
  it("HomeScreen deve ter menu hambúrguer", () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId("header-left-button")).toBeTruthy();
  });

  it("ManualConfigScreen deve ter menu hambúrguer", () => {
    const { getByTestId } = render(<ManualConfigScreen />);
    expect(getByTestId("header-left-button")).toBeTruthy();
  });

  it("Preset NÃO deve iniciar timer automaticamente", async () => {
    const { getByText, queryByTestId } = render(<CategoryPresetsScreen />);

    fireEvent.press(getByText("HIIT Intenso"));

    // NÃO deve estar em ActiveTimer
    await waitFor(() => {
      expect(queryByTestId("active-timer")).toBeNull();
    });

    // Deve estar em ManualConfig
    expect(getByText("Configuração Manual")).toBeTruthy();
  });

  it("Timer, TTS, Histórico devem continuar funcionando", () => {
    // ... testes existentes devem passar sem modificação
  });
});
```

---

## 8. VALIDAÇÕES E EDGE CASES

### 8.1 ManualConfigScreen com Preset

| Cenário | Input | Comportamento Esperado |
|---------|-------|------------------------|
| Preset válido | `{ prepTime: 10, exerciseTime: 45, ... }` | Campos preenchidos |
| Preset com valores inválidos | `{ prepTime: -5, ... }` | Usa valores mínimos (1s) |
| Sem preset | `undefined` | Carrega do storage |
| Preset parcial | `{ prepTime: 10 }` | Preenche apenas prepTime, resto do storage |

---

### 8.2 MenuDrawer

| Cenário | Input | Comportamento Esperado |
|---------|-------|------------------------|
| Menu aberto | `visible=true` | Drawer slide in, backdrop visível |
| Tocar backdrop | Press event | Drawer fecha, onClose chamado |
| Tocar item | "History" | Navega para History, drawer fecha |
| Menu fechado | `visible=false` | Drawer não renderizado |
| Toque rápido | Double tap | Apenas 1 navegação (debounce) |

---

## 9. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Setup de Types
- [ ] Criar type `PresetConfig` em RootStackNavigator.tsx
- [ ] Atualizar `RootStackParamList.ManualConfig`
- [ ] Verificar TypeScript sem erros

### Fase 2: MenuDrawer Compartilhado
- [ ] Criar `/client/components/MenuDrawer.tsx`
- [ ] Implementar componente completo
- [ ] Adicionar styles
- [ ] Testar animações

### Fase 3: i18n
- [ ] Adicionar `menu.title` em pt-BR, en, es, fr
- [ ] Adicionar `menu.profiles` em pt-BR, en, es, fr
- [ ] Adicionar `menu.advancedSettings` em pt-BR, en, es, fr
- [ ] Verificar todas as chaves

### Fase 4: HomeScreen
- [ ] Adicionar imports (Feather, Haptics, MenuDrawer)
- [ ] Adicionar state `menuVisible`
- [ ] Implementar `useLayoutEffect` para header buttons
- [ ] Adicionar `<MenuDrawer />` ao JSX
- [ ] Testar menu funciona

### Fase 5: ManualConfigScreen
- [ ] Atualizar type Props
- [ ] Adicionar imports
- [ ] Adicionar state `menuVisible`
- [ ] Modificar `loadConfig` para aceitar preset
- [ ] Implementar `useLayoutEffect` para header buttons
- [ ] Adicionar `<MenuDrawer />` ao JSX
- [ ] Testar preset preenche campos

### Fase 6: CategoryPresetsScreen
- [ ] Modificar `handleSelectProfile`
- [ ] Remover navegação para ActiveTimer
- [ ] Adicionar navegação para ManualConfig com preset
- [ ] Testar fluxo completo

### Fase 7: TimerConfigScreen (Refatoração)
- [ ] Remover MenuDrawer local
- [ ] Importar MenuDrawer compartilhado
- [ ] Remover `handleMenuNavigate`
- [ ] Atualizar uso do componente
- [ ] Testar menu continua funcionando

### Fase 8: Testes
- [ ] Testes unitários de MenuDrawer
- [ ] Testes de integração (Quick Start)
- [ ] Testes de integração (Preset)
- [ ] Testes de regressão
- [ ] Testes E2E completos

### Fase 9: Validação
- [ ] Testar em iOS
- [ ] Testar em Android
- [ ] Testar em Web
- [ ] Verificar acessibilidade
- [ ] Verificar performance (60fps)

---

## 10. CRITÉRIOS DE ACEITAÇÃO TÉCNICA

| ID | Critério | Validação |
|----|----------|-----------|
| AC-001 | HomeScreen tem menu hambúrguer | Inspecionar headerLeft |
| AC-002 | ManualConfigScreen tem menu hambúrguer | Inspecionar headerLeft |
| AC-003 | MenuDrawer compartilhado funciona em todas as telas | Testar navegação em Home, ManualConfig, TimerConfig |
| AC-004 | Preset preenche ManualConfigScreen | Log route.params, verificar fields |
| AC-005 | Preset NÃO inicia timer automaticamente | Verificar tela após selecionar preset |
| AC-006 | Usuário pode editar preset | Alterar campo, verificar state update |
| AC-007 | Types TypeScript corretos | `tsc --noEmit` sem erros |
| AC-008 | i18n completo em 4 idiomas | Trocar idioma, verificar labels |
| AC-009 | Sem regressões visuais | Screenshot compare V9.1 vs V9.2 |
| AC-010 | Timer/TTS/Histórico funcionam | Executar treino completo |

---

**Fim da SPEC V9.2**
