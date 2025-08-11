import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type Theme = 'light' | 'dark' | 'system';

export interface Colors {
  primary: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  notification: string;
  error: string;
  success: string;
  warning: string;
  shadow: string;
}

const lightColors: Colors = {
  primary: '#007bff',
  background: '#f8f9fa',
  surface: '#ffffff',
  card: '#ffffff',
  text: '#333333',
  textSecondary: '#6c757d',
  border: '#e9ecef',
  notification: '#007bff',
  error: '#dc3545',
  success: '#28a745',
  warning: '#ffc107',
  shadow: '#000000',
};

const darkColors: Colors = {
  primary: '#0d6efd',
  background: '#121212',
  surface: '#1e1e1e',
  card: '#2d2d2d',
  text: '#ffffff',
  textSecondary: '#adb5bd',
  border: '#404040',
  notification: '#0d6efd',
  error: '#dc3545',
  success: '#198754',
  warning: '#ffc107',
  shadow: '#000000',
};

interface ThemeContextType {
  theme: Theme;
  colors: Colors;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'user_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  
  const isDark = theme === 'system' 
    ? systemColorScheme === 'dark' 
    : theme === 'dark';
    
  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
