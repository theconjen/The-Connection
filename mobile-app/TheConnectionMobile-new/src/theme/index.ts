/**
 * Theme index - re-exports design tokens, provider, hooks and themed components
 *
 * Screens should import themed primitives from `../theme` (e.g. `Text`, `Screen`,
 * `useTheme`) while the app root should wrap with `ThemeProvider`.
 */

// Tokens (raw values)
export {
	colors,
	spacing,
	radii,
	shadows,
	fontSize,
	lineHeight,
	fontFamily,
	fontWeight,
} from './tokens';

// Types
export type {
	ColorScheme,
	ColorSet,
	SpacingKey,
	RadiiKey,
	ShadowKey,
	FontSizeKey,
} from './tokens';

// Theme Provider & Hooks
export {
	ThemeProvider,
	useTheme,
	useColors,
	useIsDarkMode,
	useThemedStyles,
} from './ThemeProvider';

export type { Theme } from './ThemeProvider';

// Themed Components (Text, Card, Button, Input, Divider, Screen, Badge, Avatar)
export {
	Text,
	Card,
	Button,
	Input,
	Divider,
	Screen,
	Badge,
	Avatar,
} from './components';

