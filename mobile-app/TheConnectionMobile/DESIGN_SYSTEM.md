# The Connection Mobile - Design System Guide

## Brand Colors

**IMPORTANT**: Always use the shared color constants. Never hardcode color values.

### Usage

```typescript
import { Colors } from '../../src/shared/colors';

// ✅ CORRECT - Use Colors constants
const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
  },
  text: {
    color: Colors.primaryForeground,
  },
});

// ❌ WRONG - Never hardcode colors
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#8b5cf6', // DON'T DO THIS!
  },
});
```

### Available Colors

| Color Name | Value | Usage |
|-----------|--------|-------|
| `Colors.primary` | `#0B132B` (Deep Navy Blue) | Primary buttons, links, accents |
| `Colors.primaryForeground` | `#FFFFFF` | Text on primary backgrounds |
| `Colors.secondary` | `#222D99` (Royal Blue) | Secondary buttons, highlights |
| `Colors.secondaryForeground` | `#FFFFFF` | Text on secondary backgrounds |
| `Colors.accent` | `#4A90E2` (Blue Accent) | Tertiary actions, info states |
| `Colors.accentForeground` | `#FFFFFF` | Text on accent backgrounds |
| `Colors.muted` | `#F3F4F6` | Backgrounds, disabled states |
| `Colors.mutedForeground` | `#6B7280` | Secondary text, placeholders |
| `Colors.border` | `#E5E7EB` | Borders, dividers |
| `Colors.input` | `#E5E7EB` | Input borders |
| `Colors.destructive` | `#EF4444` | Delete buttons, errors |
| `Colors.destructiveForeground` | `#FFFFFF` | Text on destructive backgrounds |
| `Colors.card` | `#FFFFFF` | Card backgrounds |
| `Colors.cardForeground` | `#111827` | Text on cards |

### Component Examples

#### Button
```typescript
button: {
  backgroundColor: Colors.primary,
  borderRadius: 8,
  padding: 16,
  alignItems: 'center',
},
buttonText: {
  color: Colors.primaryForeground,
  fontSize: 16,
  fontWeight: '600',
},
```

#### Card
```typescript
card: {
  backgroundColor: Colors.card,
  borderRadius: 12,
  padding: 16,
  borderWidth: 1,
  borderColor: Colors.border,
},
cardText: {
  color: Colors.cardForeground,
},
```

#### Avatar
```typescript
avatar: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: Colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
},
avatarText: {
  color: Colors.primaryForeground,
  fontSize: 18,
  fontWeight: 'bold',
},
```

#### Input
```typescript
input: {
  backgroundColor: Colors.card,
  borderRadius: 8,
  padding: 16,
  fontSize: 16,
  borderWidth: 1,
  borderColor: Colors.input,
  color: Colors.cardForeground,
},
inputLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: Colors.cardForeground,
  marginBottom: 8,
},
```

#### Link/Text Button
```typescript
link: {
  color: Colors.primary,
  fontSize: 14,
  fontWeight: '600',
},
```

#### ActivityIndicator
```typescript
<ActivityIndicator size="large" color={Colors.primary} />
```

#### Tab Navigation
```typescript
<Tabs
  screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: Colors.primary
  }}
>
```

## Typography

### Font Families

```typescript
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Merriweather_400Regular } from '@expo-google-fonts/merriweather';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display';
```

### Usage

- **Body Text**: Inter Regular (400)
- **Bold Text**: Inter Bold (700)
- **Headings**: Merriweather Regular (400)
- **Decorative/Brand**: Playfair Display Regular (400)

### Type Scale

```typescript
// From theme/tokens.ts
fontSize: {
  xs: 12,
  sm: 14,
  md: 16,   // Base size
  lg: 18,
  xl: 20,
  '2xl': 24,
}
```

### Example Styles

```typescript
heading: {
  fontFamily: 'Merri',
  fontSize: 24,
  fontWeight: '400',
  color: Colors.cardForeground,
},
body: {
  fontFamily: 'Inter',
  fontSize: 16,
  color: Colors.cardForeground,
},
bodyBold: {
  fontFamily: 'InterBold',
  fontSize: 16,
  color: Colors.cardForeground,
},
caption: {
  fontFamily: 'Inter',
  fontSize: 12,
  color: Colors.mutedForeground,
},
```

## Spacing

Use consistent spacing values from the theme:

```typescript
// theme/tokens.ts
spacing: {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
}
```

## Border Radius

```typescript
// theme/tokens.ts
radii: {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
}
```

## Shadows

```typescript
// theme/tokens.ts
shadows: {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
}
```

## Best Practices

### ✅ DO

- Always import and use `Colors` from `../../src/shared/colors`
- Use semantic color names (primary, secondary, accent)
- Refer to this guide when styling components
- Test components in both light and dark modes
- Use the design tokens for spacing, radii, and shadows

### ❌ DON'T

- Never hardcode color hex values (`#8b5cf6`, `#000000`, etc.)
- Don't use arbitrary spacing values (use theme tokens)
- Don't create custom colors without adding them to the Colors object
- Don't use different font weights than the loaded fonts

## Enforcement

A pre-commit hook checks for hardcoded colors. If you see this error:

```
Error: Hardcoded color values found. Use Colors from shared/colors.ts instead.
```

Replace any hardcoded colors with the appropriate `Colors` constant.

## Questions?

If you need a color that doesn't exist in the design system, please:

1. Check if an existing color can be used
2. Discuss with the team before adding new colors
3. Update both the web and mobile design systems
4. Document the new color in this guide

---

**Remember**: Brand consistency is critical. Always use the design system!
