> [← Design System Index](./index.md)
>
> *Deep reference: full BurangrangDesign colour scales (50-950), typography scale, spacing tokens, theme variables, animation durations, component variants, DO/DON'T anti-patterns.*

> This file holds the **Design System** section originally in `frontend/TRD.md` L915–1443, absorbed into the design system on 2026-05-24. See [exec-plan](../exec-plans/completed/2026-05-24-tidy-leftover-docs.md).

## 🎨 Design System

### Overview

The frontend application uses a comprehensive design system built on modern web technologies to ensure consistency, accessibility, and maintainability across all modules. The design system is based on **shadcn/ui** components, **Tailwind CSS** for styling, and a custom **BurangrangDesign System** color and theme system.

### Core Technologies

#### 1. Component Library: shadcn/ui
- **Base**: Built on **Radix UI** primitives for accessibility and functionality
- **Styling**: Tailwind CSS with `class-variance-authority` for variant management
- **Location**: `src/core/components/ui/`
- **Philosophy**: Copy-paste components that can be customized per project needs
- **Key Features**:
  - Fully accessible components with ARIA support
  - Unstyled by default, styled with Tailwind
  - TypeScript-first with full type safety
  - Composable and customizable

#### 2. Styling: Tailwind CSS
- **Version**: 3.4+
- **Configuration**: `tailwind.config.ts`
- **Base Colors**: Imported from `src/core/lib/theme/colors.ts`
- **CSS Variables**: Dynamic theming via HSL color variables
- **Plugins**: `tailwindcss-animate` for animations
- **Dark Mode**: Class-based (`dark:` prefix)

#### 3. Icon System: Lucide React
- **Library**: `lucide-react` (v0.462+)
- **Wrapper Component**: `src/core/components/ui/icon.tsx`
- **Icon Picker**: `src/core/components/ui/icon-picker.tsx` for dynamic icon selection
- **Usage**: Import icons directly or use the `Icon` wrapper component
- **Size Standards**:
  - 16px (h-4 w-4) - Inline with text, default
  - 20px (h-5 w-5) - Buttons, form fields
  - 24px (h-6 w-6) - Cards, section headers
  - 32px+ (h-8 w-8+) - Empty states, large displays
- **Consistency**: Use one icon library (Lucide React) throughout
- **Placement**: Left of text in buttons, right for dropdowns
- **Color**: Inherit text color or use semantic colors (primary, destructive, etc.)

### Color System

#### BurangrangDesign System Colors

The application uses a comprehensive color token system defined in `src/core/lib/theme/colors.ts`:

```typescript
// Base color palette with full scale (50-950)
baseColors = {
  indigo: { 50-950 },    // Primary brand color
  purple: { 50-950 },    // Secondary brand color
  orange: { 50-950 },     // Accent color
  slate: { 50-950 },     // Neutrals
  green: { 50-950 },     // Success states
  red: { 50-950 },       // Error/destructive states
  yellow: { 50-950 },    // Warning states
  blue: { 50-950 },      // Info states
  gray: { 50-950 },      // Additional neutrals
}
```

#### Semantic Color Tokens

Semantic colors map to specific UI purposes:

```typescript
semanticColors = {
  app: {
    background: slate[50],
    foreground: slate[800],
    primary: indigo[500],
    secondary: purple[700],
    accent: orange[500],
    muted: slate[100],
    border: slate[200],
  },
  text: {
    primary: slate[800],
    secondary: slate[600],
    muted: slate[500],
    disabled: slate[400],
    link: indigo[600],
  },
  status: {
    success: { light, base, dark, foreground },
    warning: { light, base, dark, foreground },
    error: { light, base, dark, foreground },
    info: { light, base, dark, foreground },
  }
}
```

#### Theme Color Variants

Users can select from multiple theme color options:
- `blue` (default)
- `green`
- `purple`
- `red`
- `orange`
- `indigo`

Each theme provides `primary`, `secondary`, and `accent` color variants in HSL format for Tailwind CSS compatibility.

### Typography

#### Font System
- **Base Font**: System font stack (inherits from Tailwind defaults)
- **Font Sizes**: Tailwind's default scale (text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl)
- **Font Weights**: 
  - `font-medium` (500) - Default for buttons and emphasis
  - `font-semibold` (600) - Card titles, section headers
  - `font-bold` (700) - Page titles, important headings

#### Typography Scale Reference

Complete typography scale for back-office systems:

```
H1: 2rem (32px) - Page titles
H2: 1.5rem (24px) - Section headers
H3: 1.25rem (20px) - Sub-sections
H4: 1.125rem (18px) - Card headers
Body: 0.875rem - 1rem (14-16px) - Main content
Small: 0.75rem - 0.875rem (12-14px) - Labels, captions
Tiny: 0.625rem - 0.75rem (10-12px) - Hints, timestamps

Font Weight:
- Regular (400): Body text
- Medium (500): Labels, emphasized text, buttons
- Semibold (600): Table headers, form labels
- Bold (700): Headings, important numbers
```

#### Typography Patterns

```typescript
// Page titles
<h1 className="text-2xl font-bold tracking-tight">{title}</h1>

// Card titles
<h3 className="text-2xl font-semibold leading-none tracking-tight">{title}</h3>

// Section headers
<h3 className="text-lg font-medium mb-4">{title}</h3>

// Body text
<p className="text-sm text-muted-foreground">{content}</p>

// Labels
<label className="text-sm font-medium">{label}</label>
```

### Spacing & Layout

#### Spacing Scale
Uses Tailwind's default spacing scale (0.25rem increments) following 8px grid system:
- `space-1` = 0.25rem (4px) - xs: Icon gaps, tight spacing
- `space-2` = 0.5rem (8px) - sm: Input padding, compact lists
- `space-3` = 0.75rem (12px)
- `space-4` = 1rem (16px) - md: Form field spacing, card padding
- `space-6` = 1.5rem (24px) - lg: Section spacing
- `space-8` = 2rem (32px) - xl: Major section dividers
- `space-12` = 3rem (48px) - 2xl: Page content margins

Additional custom spacing variables in `theme.css`:
```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-12: 3rem;
--space-16: 4rem;
```

#### Layout Patterns

**Main Layout Structure**:
```typescript
// Main content area
<main className="flex-1 p-4 md:p-6 overflow-x-auto">
  <div className="animate-fade-in">{children}</div>
</main>

// Sidebar widths
sidebarOpen ? "md:ml-64" : "md:ml-20"  // 256px / 80px

// Card padding
<CardContent className="p-6 pt-0" />
<CardHeader className="flex flex-col space-y-1.5 p-6" />
```

**Common Spacing Patterns**:
- Page padding: `p-4 md:p-6`
- Card padding: `p-6`
- Form field gaps: `gap-4` or `space-y-6`
- Button groups: `gap-2`
- Section margins: `mb-6` or `mb-4`

### Border Radius

Consistent border radius across components:
- **Default**: `--radius: 0.5rem` (8px)
- **Small**: `calc(var(--radius) - 4px)` = 4px
- **Medium**: `calc(var(--radius) - 2px)` = 6px
- **Large**: `var(--radius)` = 8px
- **Full**: `rounded-full` for badges and avatars

### Shadows & Elevation

Standard shadow utilities for visual hierarchy:
- `shadow-sm` - Subtle elevation (cards): `0 1px 3px rgba(0,0,0,0.1)`
- `shadow-md` - Medium elevation (modals, popovers): `0 4px 6px rgba(0,0,0,0.1)`
- `shadow-lg` - High elevation (dropdowns): `0 10px 15px rgba(0,0,0,0.1)`

### Borders

Consistent border styling:
- **Border width**: 1px solid for dividers, inputs
- **Border color**: Neutral-200 to neutral-300 (`border-border` token)
- **Border radius**: Follows radius system (see Border Radius section)

### Component Variants

#### Button Variants & Hierarchy

Button hierarchy for back-office systems (priority order):

1. **Primary** (default): Filled, high contrast - Main action (Save, Submit, Create)
   ```typescript
   default: "bg-primary text-primary-foreground hover:bg-primary/90"
   ```

2. **Secondary**: Outlined - Alternative actions (Cancel, Back)
   ```typescript
   outline: "border border-input bg-background hover:bg-accent"
   secondary: "bg-secondary text-secondary-foreground"
   ```

3. **Tertiary/Ghost**: Text only - Low priority (View Details, Edit)
   ```typescript
   ghost: "hover:bg-accent hover:text-accent-foreground"
   ```

4. **Destructive**: Red primary - Delete, Remove, Reject
   ```typescript
   destructive: "bg-destructive text-destructive-foreground"
   ```

5. **Link**: Text with underline - Navigation actions
   ```typescript
   link: "text-primary underline-offset-4 hover:underline"
   ```

6. **Icon Buttons**: Square/circular for compact actions
   ```typescript
   icon: "h-10 w-10"
   ```

**Size variants**:
- `sm`: h-9 (36px) - Compact contexts
- `default`: h-10 (40px) - Standard buttons
- `lg`: h-11 (44px) - Prominent actions
- `icon`: h-10 w-10 (40px) - Icon-only buttons

#### Badge Variants
```typescript
default: "border-transparent bg-primary text-primary-foreground"
secondary: "border-transparent bg-secondary text-secondary-foreground"
destructive: "border-transparent bg-destructive text-destructive-foreground"
outline: "text-foreground"
```

### Theme System

#### Light/Dark Mode
- **Toggle**: User-selectable via `useTheme()` hook
- **Persistence**: Saved to localStorage and backend
- **System Detection**: Respects `prefers-color-scheme` on first load
- **Implementation**: CSS variables with `.dark` class on `document.documentElement`

#### Theme Provider
```typescript
// Usage
import { useTheme } from '@/core/lib/theme';

const { theme, mode, setTheme, setMode, toggleMode, isDark } = useTheme();
```

#### CSS Variables
Dynamic CSS variables set via JavaScript:
```css
--primary: [HSL values from theme]
--secondary: [HSL values from theme]
--accent: [HSL values from theme]
--background: [mode-dependent]
--foreground: [mode-dependent]
--muted: [mode-dependent]
--border: [mode-dependent]
--radius: 0.5rem
```

### Animation & Transitions

#### Animation Durations
```css
--transition-fast: 150ms;
--transition-normal: 250ms;
--transition-slow: 400ms;
```

#### Custom Animations
Defined in `tailwind.config.ts`:
- `fade-in`: Opacity + translateY animation
- `fade-out`: Reverse fade-in
- `accordion-down/up`: Height transitions
- `spin-slow`: 3s rotation for loading indicators

#### Common Animation Patterns
```typescript
// Loading spinner
<div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />

// Page transitions
<div className="animate-fade-in">{content}</div>

// Sidebar transitions
<div className="transition-all duration-300 ease-in-out" />
```

### Form Components

#### Form Library Stack
- **Validation**: Zod schemas
- **Form Management**: React Hook Form
- **Resolver**: `@hookform/resolvers/zod`
- **Components**: shadcn/ui Form components

#### Form Patterns
```typescript
// Form setup
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: { /* ... */ }
});

// Form field
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**⚠️ Important**: When forms are rendered inside Dialog modals, use `ModalCombobox` instead of `SearchableSelect` for searchable select fields. See "Searchable Select/Combobox Inside Dialog Pattern" in Module Interaction Patterns section for details.

### Status & Feedback

#### Toast Notifications
- **Library**: Sonner
- **Position**: `bottom-right`
- **Features**: Rich colors, action buttons, auto-dismiss
- **Usage**: `toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()`

#### Status Badges
Consistent status color mapping following semantic color system:

```typescript
// Semantic Status Colors
active/approved/success: green-100 bg, green-800 text
pending/in-progress/warning: yellow-100 bg, yellow-800 text (amber)
inactive/draft: gray-100 bg, gray-800 text
rejected/error/destructive: red-100 bg, red-800 text
info/new: blue-100 bg, blue-800 text
```

**Status Color Guidelines**:
- **Active/Approved**: Green - Positive states, completed actions
- **Pending/In Progress**: Yellow/Amber - Warnings, pending states
- **Inactive/Draft**: Gray - Neutral, non-active states
- **Rejected/Error**: Red - Errors, destructive actions, critical alerts
- **Info/New**: Blue - Informational messages, new items

All status badges use light background (100) with dark text (800) for optimal readability and contrast.

### Component Usage Guidelines

#### ✅ DO - Best Practices

1. **Use Design System Components**
   ```typescript
   // ✅ Use shared components
   import { Button } from '@/core/components/ui/button';
   import { Card, CardHeader, CardTitle, CardContent } from '@/core/components/ui/card';
   ```

2. **Use Semantic Color Tokens**
   ```typescript
   // ✅ Use semantic colors
   className="bg-primary text-primary-foreground"
   className="text-muted-foreground"
   className="border-border"
   ```

3. **Consistent Spacing**
   ```typescript
   // ✅ Use Tailwind spacing scale
   <div className="flex gap-4 p-6">
   <div className="space-y-2">
   ```

4. **Theme-Aware Components**
   ```typescript
   // ✅ Use theme hook for dynamic theming
   const { theme, isDark } = useTheme();
   ```

5. **Accessible Components**
   ```typescript
   // ✅ Use shadcn/ui components (built on Radix UI)
   // ✅ Include ARIA labels where needed
   // ✅ Use proper semantic HTML
   ```

#### ❌ DON'T - Anti-Patterns

1. **Hard-coded Colors**
   ```typescript
   // ❌ DON'T use hard-coded colors
   className="bg-blue-500 text-white"
   
   // ✅ DO use semantic tokens
   className="bg-primary text-primary-foreground"
   ```

2. **Inline Styles for Colors**
   ```typescript
   // ❌ DON'T use inline styles for theming
   style={{ backgroundColor: '#6366f1' }}
   
   // ✅ DO use CSS variables or Tailwind classes
   className="bg-primary"
   ```

3. **Custom Component Variants**
   ```typescript
   // ❌ DON'T create module-specific button variants
   <button className="custom-module-button">
   
   // ✅ DO extend existing variants or use composition
   <Button variant="outline" className="module-specific-class">
   ```

4. **Inconsistent Spacing**
   ```typescript
   // ❌ DON'T use arbitrary values
   className="p-[13px] m-[7px]"
   
   // ✅ DO use Tailwind scale
   className="p-4 m-2"
   ```

5. **Direct Icon Imports Everywhere**
   ```typescript
   // ❌ DON'T import all icons in every file
   import { User, Settings, Home } from 'lucide-react';
   
   // ✅ DO use Icon component or import only needed icons
   import { Icon } from '@/core/components/ui/icon';
   <Icon name="User" />
   ```

### Design System Files Reference

```
src/
├── core/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── form.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── icon.tsx
│   │   │   └── ...
│   │   └── layout/                # Layout components
│   │       ├── MainLayout.tsx
│   │       ├── DynamicSidebar.tsx
│   │       └── TopNavbar.tsx
│   └── lib/
│       ├── theme/
│       │   ├── colors.ts          # Color tokens
│       │   ├── utils.ts           # Theme utilities
│       │   ├── ThemeProvider.tsx  # Theme context
│       │   └── theme.css          # CSS variables
│       └── utils.ts               # cn() utility
├── index.css                      # Tailwind imports + CSS variables
└── tailwind.config.ts             # Tailwind configuration
```

### Design System Checklist

When implementing new components or pages:

- [ ] **Colors**: Use semantic color tokens, not hard-coded values
- [ ] **Spacing**: Use Tailwind spacing scale consistently
- [ ] **Typography**: Follow established text size and weight patterns
- [ ] **Components**: Use shadcn/ui components from `@/core/components/ui`
- [ ] **Icons**: Use Lucide React icons consistently
- [ ] **Theme**: Ensure components work in both light and dark modes
- [ ] **Accessibility**: Include ARIA labels, keyboard navigation support
- [ ] **Responsive**: Use Tailwind responsive prefixes (sm:, md:, lg:)
- [ ] **Animations**: Use established animation patterns
- [ ] **Forms**: Use React Hook Form + Zod validation
- [ ] **Feedback**: Use Sonner toast notifications for user feedback
