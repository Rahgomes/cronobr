# PRD: Home Profissional Visual Refinements (V9.1)

**Feature ID:** feature-home-profissional-refinements-0010
**Version:** 9.1
**Type:** Visual Refinement & UX Enhancement
**Priority:** High
**Status:** Planning
**Created:** 2026-01-18

---

## 1. Executive Summary

V9.1 focuses on visual refinement of the "Home Profissional" screen created in V9. This release elevates the home screen's visual design to a premium, modern aesthetic while maintaining all existing functionality. Key improvements include a hero banner image, refined card components with enhanced visual hierarchy, improved spacing and typography, and preparation for future calendar integration (V10).

---

## 2. Background & Context

### 2.1 Current State (V9)
The V9 release successfully implemented the "Home Profissional" with:
- 6 workout modalities (HIIT, TABATA, EMOM, AMRAP, BOXE, MOBILIDADE)
- Quick Start card for manual configuration
- Last Workout card showing recent activity
- 2-column grid layout for modalities
- Basic card styling with animations
- Full internationalization (4 languages)

### 2.2 Problem Statement
While V9 is functionally complete, the visual design lacks:
- A prominent hero/banner element to establish brand presence
- Premium card styling with modern gradients and visual depth
- Consistent spacing hierarchy between sections
- Visual impact in the Quick Start and Modality cards
- Professional polish matching modern fitness app standards

### 2.3 Design Reference
User has provided a hero image (`ui/home-nova-interface-cronobr.png`) showing the target visual design with:
- Dark themed hero banner at the top
- Refined Quick Start card with better visual hierarchy
- Modality cards with diagonal/dynamic layouts
- Enhanced spacing and typography
- Premium color treatments

---

## 3. Goals & Success Metrics

### 3.1 Business Goals
1. Increase user engagement with home screen
2. Establish premium brand perception
3. Improve first-time user experience
4. Prepare UI for future calendar integration (V10)

### 3.2 User Goals
1. Instantly understand app purpose and available modalities
2. Easily navigate to quick start or specific modalities
3. Experience smooth, delightful interactions
4. Enjoy a visually appealing, professional interface

### 3.3 Success Metrics
- **Qualitative:** Visual design matches reference image
- **Functional:** No regression in existing features
- **Performance:** Animations remain at 60fps
- **Accessibility:** i18n fully supported across all new elements
- **Code Quality:** Reusable components follow existing patterns

---

## 4. Target Audience

### 4.1 Primary Users
- Fitness enthusiasts seeking structured workout timing
- CrossFit and HIIT practitioners
- Personal trainers configuring client workouts
- Home workout practitioners

### 4.2 User Personas
**Persona 1: "Quick Start User"**
- Wants immediate workout start with minimal configuration
- Values speed and simplicity
- Uses manual/quick start frequently

**Persona 2: "Modality Specialist"**
- Focuses on specific workout types (HIIT, TABATA, etc.)
- Appreciates clear visual differentiation between modalities
- Returns to same modality type regularly

**Persona 3: "Visual Learner"**
- Responds to visual cues and hierarchy
- Appreciates modern, premium design
- Influenced by aesthetics in app choice

---

## 5. Functional Requirements

### 5.1 Hero Banner Component
**ID:** FR-001
**Priority:** High
**Description:** Add hero image banner at top of home screen

**Requirements:**
- Display provided hero image at top of home screen
- Image height: 180-240px (max 35% of screen height)
- Border radius: 8-12px for modern aesthetic
- Theme-compatible (works in light and dark modes)
- Positioned above Quick Start card
- Uses `resizeMode="cover"` for proper image scaling
- Responsive to different screen sizes
- Optional: Tap to trigger future campaign/promotional actions (V10+)

**Acceptance Criteria:**
- ✓ Hero image appears at top of home screen
- ✓ Image scales properly on all device sizes
- ✓ Maintains aspect ratio with cover mode
- ✓ Works in both light and dark themes
- ✓ Has proper spacing below (24px to Quick Start)

---

### 5.2 Quick Start Card Refinement
**ID:** FR-002
**Priority:** High
**Description:** Enhance Quick Start card with premium visual treatment

**Requirements:**
- Larger, more prominent icon (48-64px)
- Gradient or semi-transparent background overlay
- Bold title typography (fontWeight: 600-700)
- Clearer subtitle: "Configure seu treino manualmente"
- More prominent chevron/arrow (24-28px)
- Enhanced padding for spacious feel (20-24px)
- Subtle shadow or elevation effect
- Maintains haptic feedback on press
- Maintains FadeInDown animation

**Acceptance Criteria:**
- ✓ Card visually stands out more than V9
- ✓ Title is bold and prominent
- ✓ Icon is larger and more visible
- ✓ Chevron indicates clear navigation affordance
- ✓ Press feedback works as before
- ✓ Animation timing unchanged

---

### 5.3 Modality Card Redesign
**ID:** FR-003
**Priority:** High
**Description:** Redesign modality cards with enhanced visual hierarchy

**Requirements:**
- Larger icon placement (64-80px)
- Icon positioned to left side of card
- Stronger background variation (subtle gradient or tonal shift)
- Larger title text (20-24px, fontWeight: 700)
- Smaller, refined subtitle (14px)
- Uniform padding: 20-24px
- Consistent spacing between cards (16-20px)
- Maintains color-coded icons per modality:
  - HIIT: Red (#F44336)
  - TABATA: Blue (#2196F3)
  - EMOM: Yellow (#FFC107)
  - AMRAP: Orange (#FF6B35)
  - BOXE: Purple (#9C27B0)
  - MOBILIDADE: Green (#4CAF50)
- Staggered FadeInUp animations (50-80ms delay)
- Supports future grid layout mode (V9.2)

**Acceptance Criteria:**
- ✓ Cards match visual style from reference image
- ✓ Icon colors match existing color scheme
- ✓ Text hierarchy is clear (title > subtitle)
- ✓ Animations are smooth and staggered
- ✓ Cards work in 2-column grid layout
- ✓ Theme-compatible styling

---

### 5.4 Section Spacing & Hierarchy
**ID:** FR-004
**Priority:** Medium
**Description:** Implement consistent spacing between sections

**Requirements:**
- 24px spacing: Hero → Quick Start
- 32px spacing: Quick Start → Modalities section
- Section titles: fontWeight: 600, fontSize: 20-24px
- Consistent vertical rhythm throughout screen
- Top padding from safe area: 16px
- Bottom padding for scroll: 32px

**Acceptance Criteria:**
- ✓ Clear visual separation between sections
- ✓ Spacing feels premium and uncluttered
- ✓ Works on various screen heights
- ✓ Scroll behavior feels smooth

---

### 5.5 Title & Subtitle Updates
**ID:** FR-005
**Priority:** Medium
**Description:** Update home screen title and subtitle

**Requirements:**
- Main title: "CronôBR" (existing)
- New subtitle: "Escolha sua modalidade de treino"
- Subtitle font size: 16-18px
- Subtitle color: theme.textSecondary
- Title fontWeight: 700
- Subtitle fontWeight: 400

**Acceptance Criteria:**
- ✓ Title and subtitle clearly visible
- ✓ Typography hierarchy is clear
- ✓ Translates across all 4 languages
- ✓ Works in light and dark themes

---

### 5.6 Preview Navigation Adjustment
**ID:** FR-006
**Priority:** Low
**Description:** Refine "Preview Training" button visibility

**Requirements:**
- Button appears only when workout is configured
- Link-style appearance (less prominent)
- Text: "Pré-visualizar Treino" (i18n)
- Positioned at bottom of screen or as subtle link
- Maintains navigation to preview screen

**Acceptance Criteria:**
- ✓ Button only shows when applicable
- ✓ Doesn't compete visually with primary actions
- ✓ Still easily discoverable when needed
- ✓ Navigation works as before

---

### 5.7 Internationalization
**ID:** FR-007
**Priority:** High
**Description:** All new strings must support 4 languages

**Requirements:**
- Add i18n keys for all new strings:
  - `home.hero.title`
  - `home.hero.subtitle`
  - `home.quickStart.title`
  - `home.quickStart.subtitle`
  - `home.modalities.title`
  - `home.previewTraining`
- Support languages: pt-BR, en, es, fr
- Follow existing translation structure in `/client/lib/i18n.ts`
- Use dot-notation paths

**Acceptance Criteria:**
- ✓ All languages display correctly
- ✓ No hardcoded strings in components
- ✓ Fallback to pt-BR if translation missing
- ✓ Language switching works instantly

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Animations maintain 60fps on mid-range devices
- Image loading doesn't block UI rendering
- Hero image optimized (< 500KB recommended)
- No jank on scroll

### 6.2 Accessibility
- Proper contrast ratios (WCAG AA minimum)
- Tap targets minimum 44x44px
- Screen reader compatible labels
- Supports dynamic font sizing

### 6.3 Compatibility
- iOS 13+
- Android 8.0+
- Web browsers (Chrome, Safari, Firefox)
- Light and dark theme support
- Portrait and landscape orientations

### 6.4 Maintainability
- Reusable component architecture
- Follows existing code patterns
- Type-safe TypeScript interfaces
- Clear component naming conventions

---

## 7. Out of Scope (V9.1)

The following are explicitly **NOT** included in V9.1:

1. **Grid Layout Mode:** Alternative grid view for modalities (deferred to V9.2)
2. **Calendar Integration:** Calendar widget/view (planned for V10)
3. **Dynamic Hero Content:** Campaign system for changing hero images (future)
4. **Workout Template Cards:** Pre-configured workout shortcuts (future)
5. **Social Features:** Sharing, leaderboards, or social elements
6. **Profile Quick Access:** Avatar or profile card on home screen
7. **Statistics Dashboard:** Summary metrics/charts on home
8. **Search/Filter:** Modality search or filtering capabilities
9. **Customizable Layout:** User-configurable home screen layout
10. **Onboarding Flow:** First-time user tutorial/walkthrough

---

## 8. User Stories

### Story 1: First-Time User
**As a** new user opening the app for the first time
**I want to** immediately understand what the app offers
**So that** I can quickly choose a workout modality

**Acceptance Criteria:**
- Hero image establishes brand identity
- Modality cards clearly show available options
- Visual hierarchy guides eye through content

---

### Story 2: Quick Start User
**As a** user who wants to start a workout immediately
**I want to** easily find and tap the Quick Start option
**So that** I can configure my workout manually without delay

**Acceptance Criteria:**
- Quick Start card is visually prominent
- Clear call-to-action with icon and text
- One-tap access from home screen

---

### Story 3: Modality Specialist
**As a** HIIT enthusiast
**I want to** quickly identify and select the HIIT modality
**So that** I can start my specialized workout

**Acceptance Criteria:**
- HIIT card clearly labeled with icon
- Color coding helps quick identification
- Description explains modality briefly

---

### Story 4: Returning User
**As a** user who completed a workout yesterday
**I want to** see my last workout and repeat it easily
**So that** I can maintain consistency in my training

**Acceptance Criteria:**
- Last Workout card remains visible
- Repeat button works as before
- Card doesn't interfere with new visual design

---

### Story 5: Visual Experience User
**As a** user who values aesthetics
**I want to** experience a modern, premium-looking app
**So that** I feel motivated to use it regularly

**Acceptance Criteria:**
- Visual design feels polished and professional
- Animations are smooth and delightful
- Color scheme is cohesive and appealing

---

## 9. Design Assets

### 9.1 Hero Image
- **Source:** Provided by user via Nano Banana
- **Location:** `/home/runner/workspace/ui/home-nova-interface-cronobr.png`
- **Target Path:** `/home/runner/workspace/assets/images/hero-home.png`
- **Format:** PNG
- **Recommended Size:** 1200x400px @2x
- **Theme Variant:** Single dark-themed version (V9.1), light variant future

### 9.2 Icons
All existing Ionicons maintained:
- `rocket-outline` - Quick Start
- `flame-outline` - HIIT
- `repeat-outline` - TABATA
- `time-outline` - EMOM
- `flash-outline` - AMRAP
- `fitness-outline` - BOXE
- `body-outline` - MOBILIDADE

---

## 10. Dependencies & Constraints

### 10.1 Technical Dependencies
- React Native Reanimated (v4.1.1)
- Expo Image (~3.0.10)
- Expo Haptics (~15.0.7)
- @expo/vector-icons (^15.0.2)

### 10.2 Design Dependencies
- User-provided hero image
- Existing theme system
- Current typography scale

### 10.3 Constraints
- Must not break existing V9 functionality
- Must maintain 4-language support
- Must work on existing device support matrix
- Hero image file size should be optimized

---

## 11. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Hero image too large, slow loading | Medium | Medium | Optimize image, lazy load, show placeholder |
| Animation performance degradation | High | Low | Test on low-end devices, simplify if needed |
| Design inconsistency across themes | Medium | Medium | Test both themes extensively |
| Text overflow in translations | Low | Medium | Test all 4 languages, use ellipsis where needed |
| Breaking existing navigation | High | Low | Comprehensive testing of all navigation paths |

---

## 12. Success Criteria

### 12.1 Visual Quality
- ✓ Home screen matches reference design aesthetic
- ✓ Hero image displays correctly
- ✓ Cards have premium, modern appearance
- ✓ Typography hierarchy is clear and readable

### 12.2 Functional Quality
- ✓ All V9 features work without regression
- ✓ Navigation flows remain intact
- ✓ Animations are smooth (60fps)
- ✓ Haptic feedback works as before

### 12.3 Internationalization
- ✓ All 4 languages display correctly
- ✓ No layout breaking with longer translations
- ✓ Language switching works instantly

### 12.4 Theme Compatibility
- ✓ Works perfectly in light theme
- ✓ Works perfectly in dark theme
- ✓ System theme auto-detection works

---

## 13. Release Plan

### Phase 1: Component Development
- Create HeroCard component
- Create QuickStartCardV2 component
- Create ModalidadeCardV2 component
- Update i18n translations

### Phase 2: Integration
- Integrate new components into HomeScreen
- Update spacing and layout
- Add hero image asset
- Wire up navigation

### Phase 3: Testing
- Visual regression testing
- Cross-device testing
- Theme switching testing
- Language switching testing
- Performance profiling

### Phase 4: Polish
- Fine-tune animations
- Adjust spacing if needed
- Optimize hero image
- Final QA pass

---

## 14. Future Considerations (Post V9.1)

### V9.2 Planned Enhancements
- Grid layout toggle for modalities
- Modality card variants (compact, expanded)

### V10 Planned Features
- Calendar widget integration on home screen
- Weekly workout overview
- Streak tracking

### Future Possibilities
- Dynamic hero content system for campaigns
- Seasonal themes/hero images
- Personalized workout recommendations on home
- Quick stats dashboard

---

## 15. Appendix

### A. Related Documents
- Technical Specification: `/docs/spec/feature-home-profissional-refinements-0010.md`
- Implementation Plan: TBD (will be in Claude plan file)

### B. Reference Materials
- Hero Image: `/home/runner/workspace/ui/home-nova-interface-cronobr.png`
- V9 Home Implementation: `/home/runner/workspace/client/screens/HomeScreen.tsx`

### C. Stakeholders
- Product Owner: User/Client
- Developer: Claude Code (Implementation)
- Designer: Nano Banana (Hero Image Asset)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-18
**Next Review:** Post V9.1 Implementation
