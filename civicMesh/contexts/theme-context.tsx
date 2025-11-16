import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type AppTheme = 'light' | 'dark';

type ThemeContextValue = {
  colorScheme: AppTheme;
  setTheme: (scheme: AppTheme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = '@civicmesh_theme_preference';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function ensureValidScheme(scheme: ColorSchemeName | null | undefined): AppTheme {
  return scheme === 'dark' ? 'dark' : 'light';
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorScheme] = useState<AppTheme>(() => ensureValidScheme(Appearance.getColorScheme()));
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasExplicitPreference, setHasExplicitPreference] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isMounted) {
          return;
        }

        if (stored === 'light' || stored === 'dark') {
          setColorScheme(stored);
          setHasExplicitPreference(true);
        } else {
          setHasExplicitPreference(false);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || !hasExplicitPreference) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, colorScheme).catch((error) => {
      console.warn('Failed to persist theme preference:', error);
    });
  }, [colorScheme, hasExplicitPreference, isHydrated]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: nextScheme }) => {
      setColorScheme((current) => {
        if (hasExplicitPreference) {
          return current;
        }
        return ensureValidScheme(nextScheme);
      });
    });

    return () => subscription.remove();
  }, [hasExplicitPreference]);

  const setTheme = useCallback((scheme: AppTheme) => {
    setColorScheme(scheme);
    setIsHydrated(true);
    setHasExplicitPreference(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setColorScheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    setIsHydrated(true);
    setHasExplicitPreference(true);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme,
      setTheme,
      toggleTheme,
    }),
    [colorScheme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemePreference must be used within an AppThemeProvider');
  }
  return context;
}
