import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSiteSettings, SITE_SETTINGS_UPDATED_EVENT, applyThemeSettings } from '../services/siteSettingsService';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const settings = getSiteSettings();
    const mode = settings.theme?.defaultMode || 'light';
    if (mode === 'dark') return 'dark';
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    // Initial theme apply
    const settings = getSiteSettings();
    applyThemeSettings(settings.theme);

    const handleSettingsUpdate = () => {
      const updated = getSiteSettings();
      applyThemeSettings(updated.theme);
      const mode = updated.theme?.defaultMode || 'light';
      if (mode === 'dark') setThemeState('dark');
      else if (mode === 'system') {
        setThemeState(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      } else {
        setThemeState('light');
      }
    };

    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    return () => window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
