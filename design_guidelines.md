# Design Guidelines: CronôBR - Workout Timer App

## Architecture Decisions

### Authentication
**No authentication required** - This is a local-first utility app for individual workout timing.

**Profile/Settings Screen Required:**
- User-customizable avatar (3 fitness-themed preset avatars: dumbbell icon, runner silhouette, stopwatch)
- Display name field (default: "Atleta")
- App preferences:
  - Sound enabled/disabled toggle
  - Vibration enabled/disabled toggle
  - Language selection (PT-BR, EN, ES, FR)
  - Theme toggle (Light/Dark)

### Navigation Structure
**Stack-Only Navigation** - Linear, focused experience:
1. **Main Timer Configuration Screen** (root)
2. **Active Timer Screen** (modal, fullscreen)
3. **Settings Screen** (push from main)
4. **Profile Screen** (push from settings)

No tab bar needed - app has single core function with supporting screens.

## Screen Specifications

### 1. Main Timer Configuration Screen

**Purpose:** Configure workout parameters before starting timer.

**Layout:**
- **Header:**
  - Custom transparent header
  - Title: "CronôBR" (centered, bold)
  - Right button: Settings icon (Feather "settings")
  - No left button
  - Safe area top inset: `headerHeight + Spacing.xl`

- **Main Content:**
  - Scrollable root view (ScrollView)
  - Bottom safe area: `insets.bottom + Spacing.xl`
  
- **Content Sections:**
  1. Hero section with app tagline "Seu parceiro de treino"
  2. Four numeric input groups with steppers
  3. Large START button (floating at bottom)

**Components:**
- **Numeric Stepper Cards** (4 total):
  - Each card has icon, label, value display, +/- buttons
  - Card layout: icon (left) | label + value (center) | stepper buttons (right)
  - Minimum height: 80px for easy touch
  - Border radius: 16px
  - Subtle elevation (1dp)
  
- **START Button:**
  - Fixed position at bottom of screen
  - Width: 90% of screen width (centered)
  - Height: 56px (minimum touch target)
  - Bottom safe area: `insets.bottom + Spacing.xl`
  - Floating shadow specifications:
    - shadowOffset: {width: 0, height: 2}
    - shadowOpacity: 0.10
    - shadowRadius: 2

### 2. Active Timer Screen

**Purpose:** Display running timer with phase indicators and controls.

**Layout:**
- **Header:** None (fullscreen immersive experience)
- **Main Content:**
  - Non-scrollable root view
  - Dynamic background color based on phase
  - All content vertically centered

**Content Structure (top to bottom):**
1. Close button (top-left, absolute position, safe area: `insets.top + Spacing.m`)
2. Round indicator (e.g., "Round 3/5")
3. Phase label with icon (e.g., "💪 Exercício")
4. Large timer display (MM:SS format)
5. Progress bar (full width, 8px height)
6. Control buttons row (PAUSE/RESUME, STOP)

**Components:**
- **Timer Display:**
  - Font size: 72px (minimum)
  - Font weight: bold
  - Monospace font family for consistent width
  
- **Progress Bar:**
  - Width: 80% of screen
  - Rounded ends (capsule shape)
  - Animated fill
  
- **Control Buttons:**
  - Two buttons side by side, equal width
  - Spacing between: Spacing.m
  - Height: 56px each
  - Icons: Feather "pause-circle" / "play-circle", "square"

### 3. Settings Screen

**Purpose:** App configuration and profile access.

**Layout:**
- **Header:**
  - Default navigation header (non-transparent)
  - Title: "Configurações"
  - Left button: Back (automatic)
  - Top safe area: Spacing.xl
  
- **Main Content:**
  - Scrollable form view
  - Bottom safe area: `insets.bottom + Spacing.xl`

**Components:**
- Profile card (tappable, navigates to Profile Screen)
- Toggle switches for sound, vibration
- Language picker (modal)
- Theme toggle
- About section (version number)

### 4. Profile Screen

**Purpose:** Personalize user avatar and name.

**Layout:**
- **Header:**
  - Default navigation header
  - Title: "Perfil"
  - Right button: "Salvar" (text button)
  
- **Main Content:**
  - Scrollable form
  - Avatar selector (horizontal scroll of 3 preset avatars)
  - Text input for display name
  - Submit/cancel buttons below form

## Design System

### Color Palette

**Primary Colors:**
- **Primary (Brand):** `#FF6B35` (Energetic orange-red)
- **Primary Dark:** `#E55A2B`
- **Primary Light:** `#FF8555`

**Phase Colors:**
- **Preparation:** `#FFC107` (Amber yellow)
- **Exercise:** `#4CAF50` (Green)
- **Rest:** `#2196F3` (Blue)

**Semantic Colors:**
- **Success:** `#4CAF50`
- **Warning:** `#FF9800`
- **Error:** `#F44336`
- **Info:** `#2196F3`

**Neutral Colors (Light Theme):**
- **Background:** `#F5F5F5`
- **Surface:** `#FFFFFF`
- **Text Primary:** `#212121`
- **Text Secondary:** `#757575`
- **Border:** `#E0E0E0`

**Neutral Colors (Dark Theme):**
- **Background:** `#121212`
- **Surface:** `#1E1E1E`
- **Text Primary:** `#FFFFFF`
- **Text Secondary:** `#B0B0B0`
- **Border:** `#333333`

### Typography

**Font Family:**
- Primary: System default (San Francisco on iOS, Roboto on Android)
- Monospace: "Courier New" or system monospace for timer display

**Type Scale:**
- **Display:** 72px, bold (timer display)
- **H1:** 32px, bold (screen titles)
- **H2:** 24px, semibold (section headers)
- **H3:** 20px, semibold (card titles)
- **Body:** 16px, regular (default text)
- **Body Small:** 14px, regular (secondary text)
- **Caption:** 12px, regular (labels)
- **Button:** 16px, semibold (all caps optional)

### Spacing Scale

```
Spacing.xs: 4px
Spacing.s: 8px
Spacing.m: 16px
Spacing.l: 24px
Spacing.xl: 32px
Spacing.xxl: 48px
```

### Border Radius

```
Radius.s: 8px (small buttons, inputs)
Radius.m: 16px (cards)
Radius.l: 24px (large cards, modals)
Radius.round: 999px (circular elements)
```

## Visual Design Guidelines

### Cards & Surfaces
- **Numeric Stepper Cards:**
  - Background: Surface color
  - Border: 1px solid Border color
  - Border radius: Radius.m
  - Padding: Spacing.m
  - Subtle shadow (elevation 1)

### Buttons

**Primary Button (START):**
- Background: Primary color
- Text: White, Button typography
- Border radius: Radius.m
- Pressed state: Scale(0.98) + Primary Dark background
- Haptic feedback on press

**Secondary Buttons (PAUSE/STOP):**
- PAUSE: Background `#FF9800` (Warning)
- STOP: Background `#F44336` (Error)
- Same styling as primary otherwise

**Stepper Buttons (+/-):**
- Circular shape (40px diameter minimum)
- Background: Primary Light (10% opacity)
- Icon: Feather "plus" / "minus"
- Pressed state: Primary Light (20% opacity)

### Icons
- Use Feather icons from @expo/vector-icons
- Size: 24px (default), 32px (large controls)
- Color: Text Primary or white on colored backgrounds

### Phase Transition Animations
- **Background color fade:** 300ms ease-in-out
- **Timer pulse (last 3 seconds):** Scale 1.0 → 1.05, repeat, 500ms
- **Round complete shake:** TranslateX -10 → 10 → 0, 200ms
- **Progress bar fill:** Linear animation, smooth

## Interaction Design

### Touch Targets
- Minimum size: 48x48px (iOS HIG / Material Design standard)
- Preferred size for primary actions: 56px height
- Spacing between adjacent touchables: Spacing.s minimum

### Feedback Mechanisms
- **Visual:** All buttons scale to 0.98 on press
- **Haptic:** 
  - Light impact on stepper button press
  - Medium impact on START/PAUSE/STOP
  - Heavy impact on phase transitions
  - Notification impact on workout complete
- **Audio:** Distinct sounds for each phase (specified in requirements)

### Disabled States
- Opacity: 0.4
- No press animation
- No haptic feedback

## Accessibility Requirements

### Screen Reader Support
- All buttons have accessible labels in selected language
- Timer announces minute markers and phase changes
- Settings clearly labeled for VoiceOver/TalkBack

### Visual Accessibility
- Color contrast ratio: 4.5:1 minimum for text
- Don't rely solely on color for phase indication (include text labels + icons)
- Support Dynamic Type (iOS) and Font Scaling (Android)

### Motor Accessibility
- Large touch targets (minimum 48px)
- No complex gestures required
- Buttons well-spaced to prevent accidental taps

## Required Assets

**Preset Avatars (3 total):**
1. **Dumbbell Icon Avatar:** Simple dumbbell silhouette in circular frame, Primary color
2. **Runner Avatar:** Running figure silhouette, Primary color
3. **Stopwatch Avatar:** Stopwatch icon, Primary color

Style: Minimalist, flat design, monochromatic using Primary color palette

**App Icon:**
- Stopwatch with "BR" text overlay
- Primary color gradient background
- Modern, energetic aesthetic

All assets should be vector-based (SVG) when possible, or high-resolution PNG with 1x, 2x, 3x variants for React Native.