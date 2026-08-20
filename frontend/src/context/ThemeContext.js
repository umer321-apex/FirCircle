import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';
import { darkTheme, lightTheme } from '../constants/theme';

const THEME_KEY = 'fitcircle_theme_mode';
const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('dark'); // default dark, since that's the flagship look
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreThemePreference();
  }, []);

  const restoreThemePreference = async () => {
    try {
      const stored = await SecureStore.getItemAsync(THEME_KEY);
      if (stored === 'light' || stored === 'dark') {
        setMode(stored);
      } else {
        const systemScheme = Appearance.getColorScheme();
        setMode(systemScheme === 'light' ? 'light' : 'dark');
      }
    } catch (error) {
      console.error(`[ThemeContext.restoreThemePreference] Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (newMode) => {
    try {
      await SecureStore.setItemAsync(THEME_KEY, newMode);
      setMode(newMode);
    } catch (error) {
      console.error(`[ThemeContext.setThemeMode] Error: ${error.message}`);
    }
  };

  const toggleTheme = () => setThemeMode(mode === 'dark' ? 'light' : 'dark');

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, mode, setThemeMode, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};