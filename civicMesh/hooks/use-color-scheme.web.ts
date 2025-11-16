import { useThemePreference } from '@/contexts/theme-context';

export function useColorScheme() {
  const { colorScheme } = useThemePreference();
  return colorScheme;
}
