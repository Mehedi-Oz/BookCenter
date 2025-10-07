import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '@/constants/colors';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  isDark: boolean;
  themeMode: ThemeMode;
  colors: typeof lightColors | typeof darkColors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@bookcenter_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isDark, setIsDark] = useState(false);

  // Simplified version without AsyncStorage for now
  /*
  // Load theme from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        console.log('Loaded theme from storage:', savedTheme); // Debug log
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);
  */

  // Update isDark based on theme mode
  useEffect(() => {
    console.log('Theme mode changed to:', themeMode); // Debug log
    if (themeMode === 'system') {
      // For now, we'll default to light mode for system
      // In a real app, you'd check the system preference
      setIsDark(false);
    } else {
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    console.log('Setting theme mode to:', mode); // Debug log
    setThemeModeState(mode);
    // Simplified version without AsyncStorage for now
    /*
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      console.log('Theme saved to storage:', mode); // Debug log
    } catch (error) {
      console.log('Error saving theme:', error);
    }
    */
  };

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const colors = isDark ? darkColors : lightColors;

  const value: ThemeContextType = {
    isDark,
    themeMode,
    colors,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
