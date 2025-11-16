# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Design Tokens & Theme Usage

This app uses a token-based color system defined in `constants/theme.ts`.

### Legacy vs New Palette
The previous minimal palette (text / background / tint / icon) is preserved as `LegacyColors`. The active palette (`Colors`) layers in:
- Brand: `brand.primary`, `brand.accent`
- Surfaces: `background`, `backgroundAlt`, `surface`, `surfaceAlt`
- Elevation: `elevation1..3`
- Borders: `border`, `borderMuted`
- Text hierarchy: `textPrimary`, `textSecondary`, `textMuted`
- Semantic categories: `semantic.{alert|warning|help|resources|accessibility}` + subtle backgrounds in `semanticBg.*`

Revert to the old palette any time by replacing:
```ts
export const Colors = { ... } // new
```
with:
```ts
export const Colors = LegacyColors;
```

### Category Helpers
Use helper functions to avoid hardcoding hex values:
```ts
import { getCategorySemanticColor, getCategorySemanticBg, Colors } from '@/constants/theme';
const color = getCategorySemanticColor(mode, post.category); // foreground
const bg = getCategorySemanticBg(mode, post.category);       // subtle background
```

### Recommended Usage Patterns
| Token | Use For |
|-------|---------|
| `background` | App root background |
| `surface` | Cards, panels |
| `surfaceAlt` | Nested sections / contrast layering |
| `elevation2/3` | Modals, drawers, overlays |
| `brand.primary` | Primary CTAs (Sign In, Submit) |
| `brand.accent` | Secondary actions, interactive icons |
| `semantic.alert` | High urgency posts (danger) |
| `semantic.warning` | Caution / advisory posts |
| `semantic.help` | Assistance requests (default category tone) |
| `semantic.resources` | Resource availability / resolved state |
| `semantic.accessibility` | Accessibility-related posts |
| `semanticBg.*` | Badge / pill soft backgrounds |

### Example: Status Badge
```tsx
<View style={{ backgroundColor: Colors[mode].semanticBg.help, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
   <Text style={{ color: Colors[mode].semantic.help, fontWeight: '600', fontSize: 10 }}>On My Way (3)</Text>
</View>
```

### Theme Access Hook (Optional)
You can create a small hook for convenience:
```ts
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
export function useTheme() {
   const scheme = useColorScheme() ?? 'light';
   return Colors[scheme];
}
```

### Accessibility Notes
All semantic foreground colors were chosen to meet or approach WCAG AA contrast against `surface` backgrounds. For critical badges against `backgroundAlt`, prefer full-hue foreground and ensure minimum 4.5:1 contrast.

### Migration Strategy
1. Replace direct hex usages with semantic tokens incrementally.
2. Refactor badges, buttons, and headers first.
3. Remove any obsolete hardcoded category color maps.
4. Audit dark mode specific contrasts (use a simulator + Accessibility Inspector).

### Future Ideas
- Add dynamic theming (user-selectable high contrast mode)
- Expose a `ThemeContext` for runtime palette switching (seasonal / event themes)
- Add spacing & typography tokens for full design system coverage.

---
For questions or improvements, open an issue or extend the theme file.
