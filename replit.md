# CronôBR - Workout Timer App

## Overview

CronôBR is a React Native/Expo workout timer application designed for interval training. The app allows users to configure workout parameters (preparation time, exercise duration, rest periods, and number of rounds) and provides a fullscreen timer experience with visual phase indicators and haptic feedback. It's a local-first utility app that stores user preferences and timer configurations using AsyncStorage - no authentication required.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54 (New Architecture enabled)
- **Navigation**: React Navigation with Native Stack Navigator (stack-only, no tabs)
- **State Management**: React Hooks (useState, useEffect, useRef) + React Query for server state
- **Styling**: Native StyleSheet with a centralized theme system (`client/constants/theme.ts`)
- **Animations**: React Native Reanimated for spring animations and haptic feedback via expo-haptics
- **Path Aliases**: `@/` maps to `./client/`, `@shared/` maps to `./shared/`

### Screen Flow
1. **TimerConfigScreen** (root) - Configure workout parameters with numeric steppers
2. **ActiveTimerScreen** (fullscreen modal) - Active workout timer with phase colors
3. **SettingsScreen** - App preferences (sound, vibration, language, theme)
4. **ProfileScreen** - User name and avatar selection

### Backend Architecture
- **Runtime**: Express.js server with TypeScript (tsx for development)
- **Purpose**: Serves landing page for web and provides API endpoints
- **Build**: esbuild bundles server to `server_dist/` for production
- **Storage**: In-memory storage with interface for future database migration

### Data Storage
- **Client-side**: AsyncStorage for settings, profile, and timer configuration
- **Server-side**: Drizzle ORM configured for PostgreSQL (schema in `shared/schema.ts`)
- **Current State**: Uses MemStorage class; database integration prepared but not active

### Design Patterns
- **Theming**: Dual light/dark theme with automatic system detection
- **Components**: Reusable themed components (ThemedText, ThemedView, Button, Card, NumericStepper)
- **Error Handling**: ErrorBoundary component with development-mode error details
- **Cross-platform**: KeyboardAwareScrollViewCompat for web/native keyboard handling

## External Dependencies

### Core Framework
- **Expo SDK 54**: Cross-platform React Native framework
- **React 19.1**: UI library
- **React Navigation 7**: Native stack navigation

### UI/UX Libraries
- **expo-haptics**: Tactile feedback for button presses
- **react-native-reanimated**: Smooth animations
- **react-native-gesture-handler**: Touch gesture handling
- **expo-blur / expo-glass-effect**: Visual effects for headers
- **@expo/vector-icons (Feather)**: Icon set

### Data Layer
- **@tanstack/react-query**: Server state management
- **@react-native-async-storage/async-storage**: Local persistence
- **drizzle-orm + drizzle-zod**: Database ORM (PostgreSQL ready)
- **pg**: PostgreSQL client

### Server
- **Express 4**: HTTP server
- **http-proxy-middleware**: Development proxy
- **ws**: WebSocket support

### Build Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Production server bundling
- **babel-preset-expo**: Expo-compatible Babel configuration