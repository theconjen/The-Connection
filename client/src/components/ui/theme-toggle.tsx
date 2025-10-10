import { Moon, Sun } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "../../contexts/theme-context";

export function ThemeToggle() {
  try {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
      if (theme === 'light') {
        setTheme('dark');
      } else if (theme === 'dark') {
        setTheme('system');
      } else {
        setTheme('light');
      }
    };

    const getIcon = () => {
      if (theme === 'light') {
        return <Sun className="h-5 w-5" />;
      } else if (theme === 'dark') {
        return <Moon className="h-5 w-5" />;
      } else {
        // System theme - show a combined icon or just sun
        return <Sun className="h-5 w-5" />;
      }
    };

    const getTitle = () => {
      if (theme === 'light') {
        return 'Switch to dark mode';
      } else if (theme === 'dark') {
        return 'Switch to system theme';
      } else {
        return 'Switch to light mode';
      }
    };

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="text-muted-foreground hover:text-foreground hover:bg-background/60"
        title={getTitle()}
      >
        {getIcon()}
      </Button>
    );
  } catch (error) {
    console.error('ThemeToggle error:', error);
    // Fallback: just show a sun icon
    return (
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground hover:bg-background/60"
        title="Theme toggle (error)"
      >
        <Sun className="h-5 w-5" />
      </Button>
    );
  }
}