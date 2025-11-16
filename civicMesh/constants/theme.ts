/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

/**
 * NOTE: We keep the original minimal light/dark palette for easy reversion.
 * LegacyColors preserves the previous structure. To revert: replace `export const Colors = NewColors;`
 * with `export const Colors = LegacyColors;` or delete NewColors and rename LegacyColors to Colors.
 */
const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const LegacyColors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Option A (Calm Civic) semantic design tokens
// Core brand & surfaces
const Brand = {
  primary: '#2643A3', // Indigo 600
  primaryForeground: '#FFFFFF',
  accent: '#0A7EA4', // Existing teal
  accentForeground: '#FFFFFF',
};

// Surfaces & elevations
const SurfacesLight = {
  background: '#F7F9FC',
  backgroundAlt: '#EEF2F6',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F4F8',
  elevation1: '#FFFFFF',
  elevation2: '#F8FAFC',
  elevation3: '#F1F4F8',
  border: '#D8DEE4',
  borderMuted: '#E2E8F0',
};
const SurfacesDark = {
  background: '#121417',
  backgroundAlt: '#161A1E',
  surface: '#1D2125',
  surfaceAlt: '#161A1E',
  elevation1: '#1D2125',
  elevation2: '#242A30',
  elevation3: '#2A3138',
  border: '#2A3138',
  borderMuted: '#343C44',
};

// Semantic category colors
const Semantic = {
  alert: '#D92D20',
  warning: '#F79009',
  help: '#0A7EA4',
  resources: '#2E7D32',
  accessibility: '#7E57C2',
};

// Subtle (soft background) variants (approx 12% tint alpha or light scale)
const SemanticBgLight = {
  alert: '#D92D201A',
  warning: '#F790091A',
  help: '#0A7EA41A',
  resources: '#2E7D321A',
  accessibility: '#7E57C21A',
};
const SemanticBgDark = {
  alert: '#D92D2030',
  warning: '#F7900930',
  help: '#0A7EA430',
  resources: '#2E7D3230',
  accessibility: '#7E57C230',
};

// Text tokens
const TextLight = {
  textPrimary: '#11181C',
  textSecondary: '#3A4752',
  textMuted: '#687076',
};
const TextDark = {
  textPrimary: '#ECEDEE',
  textSecondary: '#C2C7CB',
  textMuted: '#9BA1A6',
};

// Icon & tabs reuse existing semantic for consistency

export const Colors = {
  light: {
    // Legacy compatibility
    text: LegacyColors.light.text,
    tint: Brand.accent,
    icon: LegacyColors.light.icon,
    tabIconDefault: LegacyColors.light.icon,
    tabIconSelected: Brand.accent,
    // New tokens
    brand: Brand,
    ...SurfacesLight,
    ...TextLight,
    semantic: Semantic,
    semanticBg: SemanticBgLight,
  },
  dark: {
    text: LegacyColors.dark.text,
    tint: Brand.accentForeground, // white
    icon: LegacyColors.dark.icon,
    tabIconDefault: LegacyColors.dark.icon,
    tabIconSelected: Brand.accentForeground,
    brand: Brand,
    ...SurfacesDark,
    ...TextDark,
    semantic: Semantic,
    semanticBg: SemanticBgDark,
  },
};

/**
 * Helper to safely obtain a semantic color by category key.
 * Accepts the Post category string (including 'accessibility resources').
 */
export function getCategorySemanticColor(mode: 'light' | 'dark', category: string): string {
  const map: Record<string, keyof typeof Semantic> = {
    alert: 'alert',
    warning: 'warning',
    help: 'help',
    resources: 'resources',
    'accessibility resources': 'accessibility',
  };
  const semanticKey = map[category] || 'help';
  return Colors[mode].semantic[semanticKey];
}

export function getCategorySemanticBg(mode: 'light' | 'dark', category: string): string {
  const map: Record<string, keyof typeof SemanticBgLight> = {
    alert: 'alert',
    warning: 'warning',
    help: 'help',
    resources: 'resources',
    'accessibility resources': 'accessibility',
  };
  const semanticKey = map[category] || 'help';
  return Colors[mode].semanticBg[semanticKey];
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
