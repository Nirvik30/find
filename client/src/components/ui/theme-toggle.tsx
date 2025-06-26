import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="border-gray-700 hover:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-800 
                 bg-white hover:bg-gray-100 dark:bg-gray-900"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4 mr-2" />
          Light
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </>
      )}
    </Button>
  );
}