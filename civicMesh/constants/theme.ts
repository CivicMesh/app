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
const tintColorLight = '#000000';
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

// Original palette tokens (classic CivicMesh)
// Core brand & surfaces
const BrandLight = {
  primary: '#000000',
  primaryForeground: '#FFFFFF',
  accent: '#000000',
  accentForeground: '#FFFFFF',
};

const BrandDark = {
  primary: '#FFFFFF',
  primaryForeground: '#000000',
  accent: '#FFFFFF',
  accentForeground: '#000000',
};

// Surfaces & elevations
const SurfacesLight = {
  background: '#FFFFFF',
  backgroundAlt: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F7FA',
  elevation1: '#FFFFFF',
  elevation2: '#F8FAFC',
  elevation3: '#F1F5F9',
  border: '#E2E8F0',
  borderMuted: '#EDF2F7',
};
const SurfacesDark = {
  background: '#151718',
  backgroundAlt: '#1F2122',
  surface: '#1F2122',
  surfaceAlt: '#27292A',
  elevation1: '#1F2122',
  elevation2: '#252728',
  elevation3: '#2E3031',
  border: '#2E3031',
  borderMuted: '#3A3C3D',
};

// Semantic category colors (matching original badge hues)
const SemanticLight = {
  alert: '#FF4444',
  warning: '#FFAA00',
  help: '#0A7EA4',
  resources: '#4CAF50',
  accessibility: '#9C27B0',
};

const SemanticDark = {
  alert: '#FF4444',
  warning: '#FFAA00',
  help: '#0A7EA4',
  resources: '#4CAF50',
  accessibility: '#9C27B0',
};

// Subtle (soft background) variants
const SemanticBgLight = {
  alert: '#FF44441A',
  warning: '#FFAA001A',
  help: '#0A7EA41A',
  resources: '#4CAF501A',
  accessibility: '#9C27B01A',
};
const SemanticBgDark = {
  alert: '#FF444430',
  warning: '#FFAA0030',
  help: '#0A7EA430',
  resources: '#4CAF5030',
  accessibility: '#9C27B030',
};

// Text tokens
const TextLight = {
  textPrimary: '#11181C',
  textSecondary: '#687076',
  textMuted: '#889096',
};
const TextDark = {
  textPrimary: '#ECEDEE',
  textSecondary: '#C1C7CD',
  textMuted: '#9BA1A6',
};

// Icon & tabs reuse existing semantic for consistency

export const Colors = {
  light: {
    // Legacy compatibility
    text: TextLight.textPrimary,
    tint: BrandLight.accent,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: BrandLight.accent,
    // New tokens
    brand: BrandLight,
    ...SurfacesLight,
    ...TextLight,
    semantic: SemanticLight,
    semanticBg: SemanticBgLight,
  },
  dark: {
    text: TextDark.textPrimary,
    tint: '#FFFFFF',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FFFFFF',
    brand: BrandDark,
    ...SurfacesDark,
    ...TextDark,
    semantic: SemanticDark,
    semanticBg: SemanticBgDark,
  },
};

/**
 * Helper to safely obtain a semantic color by category key.
 * Accepts the Post category string (including 'accessibility resources').
 */
type SemanticKey = 'alert' | 'warning' | 'help' | 'resources' | 'accessibility';

const CATEGORY_TO_SEMANTIC: Record<string, SemanticKey> = {
  alert: 'alert',
  warning: 'warning',
  help: 'help',
  resources: 'resources',
  'accessibility resources': 'accessibility',
};

export function getCategorySemanticColor(mode: 'light' | 'dark', category: string): string {
  const semanticKey = CATEGORY_TO_SEMANTIC[category] || 'help';
  return Colors[mode].semantic[semanticKey];
}

export function getCategorySemanticBg(mode: 'light' | 'dark', category: string): string {
  const semanticKey = CATEGORY_TO_SEMANTIC[category] || 'help';
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
