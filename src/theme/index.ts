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
import { useTheme as useThemeFromContext } from '../contexts/ThemeContext';

export {
	ThemeProvider,
	useTheme,
} from '../contexts/ThemeContext';

export type { Theme } from '../contexts/ThemeContext';

// Helper hooks
export const useColors = () => useThemeFromContext().colors;
export const useIsDarkMode = () => useThemeFromContext().colorScheme === 'dark';

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

