import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center gap-2 rounded-xl p-2 text-sm font-medium transition-all duration-200 cursor-pointer border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8] hover:text-[#131A2B] dark:hover:text-[#FFFFFF] hover:border-[#9AA5B8] dark:hover:border-[#5B6577] hover:bg-[#F4F6F9] dark:hover:bg-[#131A2B] shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]/30 ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-[#F59E0B] transition-transform duration-200 rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-[#5B6577] transition-transform duration-200 rotate-0 scale-100" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-heading font-semibold">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}
