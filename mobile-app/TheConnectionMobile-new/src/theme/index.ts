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
	typeScale,
} from './tokens';

// Types
export type {
	ColorSet,
	ThemeTokens,
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

