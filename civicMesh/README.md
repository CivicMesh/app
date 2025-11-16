# CivicMesh Mobile App

An Expo React Native application for community safety & assistance: users can post alerts, request help, share resources, mark that they're "On My Way", and resolve posts with media evidence.

---
## Quick Start

```bash
git clone <repo-url>
cd civicMesh/app-1/civicMesh
npm install
npx expo start
```

Open in Expo Go, Android emulator, or iOS simulator from the interactive CLI.

---
## Environment Configuration

The app supports a mock mode (local fixtures) and a live backend mode.

Create or edit a `.env` file (already added) at project root:

```
EXPO_PUBLIC_API_URL=https://backend-51lr.onrender.com
EXPO_PUBLIC_USE_MOCK_API=false
```

| Variable | Purpose | Example |
|----------|---------|---------|
| `EXPO_PUBLIC_API_URL` | Base URL for backend | `https://backend-51lr.onrender.com` |
| `EXPO_PUBLIC_USE_MOCK_API` | Toggle mock data fixtures | `true` or `false` |

Switch back to mock data quickly by setting `EXPO_PUBLIC_USE_MOCK_API=true` (no network calls; useful offline / UI prototyping).

> After changing env values, restart Expo (`Ctrl+C` then `npx expo start`).

---
## Authentication

Two forms are in play:

1. **App Login / Signup** – Calls backend `/login/` (GET) and `/users/` (POST) with email & password. Backend returns a user id; we generate a session token client-side (since backend does not yet issue JWTs).
2. **Protected Endpoints** – All other endpoints (posts, upload, resolve) require **HTTP Basic Auth** using static credentials for now:

```
Username: testuser
Password: testpassword
```

The API client (`services/api.ts`) encodes these via Base64 and includes `Authorization: Basic …` for protected requests.

> Production Recommendation: Replace static Basic Auth with issued tokens (JWT / opaque session) and never embed credentials in image URLs.

---
## Features Overview

| Feature | Screen / Component | Notes |
|---------|--------------------|-------|
| View Active Posts | `app/(tabs)/index.tsx`, `feed.tsx` | Silent background refresh on tab focus for responsiveness |
| Map Visualization | `app/map.tsx` | Centers user location; silent post refresh to reduce spinner time |
| Post Detail | `app/post-detail.tsx` | Fetches latest snapshot; merges into existing state to avoid flicker |
| Create Post | `app/post-for-help.tsx` | Local photo auto-upload; backend normalized to snake_case |
| Mark On My Way | `markOnMyWay()` | Adds user id to `onMyWayBy` list |
| Resolve Post | `resolvePost()` | Requires resolution code + photo (auto-upload before PUT) |
| Auth Context | `contexts/auth-context.tsx` | Persists generated token + user in `AsyncStorage` |
| Posts Context | `contexts/posts-context.tsx` | Global caching + silent refresh logic |
| Location Context | `contexts/location-context.tsx` | Provides geolocation for map & post creation |

---
## Image Handling

### Upload
Endpoint: `POST /upload-image/{userId}?post_id={postId}` (multipart form with `file` field).

Workflow:
1. User selects local image (URI like `file:///...`).
2. `uploadImage()` sends multipart form; backend responds with `{ image_id: <n> }` (or direct URL).
3. Numeric IDs mapped to image URL; for now we embed Basic Auth credentials for RN `<Image>` (because headers cannot be sent directly by the Image component).

### Download
Endpoint: `GET /image/{id}` – returns binary image (e.g., JPEG). We currently generate image URLs like:
```
https://testuser:testpassword@backend-51lr.onrender.com/image/1
```

> Security Warning: Embedding credentials in URLs is **not** recommended for production (risks leaking via logs, proxies, or analytics). Replace with signed URLs or public CDN paths when upgrading.

### Future Improvement Ideas
- Switch to signed short-lived URLs
- Async prefetch & caching (e.g., `expo-image` advanced options)
- Placeholder shimmer while loading

---
## Data Model (Simplified)

```
Post {
   id: string
   title: string
   category: 'alert' | 'warning' | 'help' | 'resources' | 'accessibility resources'
   subcategory?: string
   description: string (backend: body)
   latitude: number
   longitude: number
   userId: string (backend: user_id)
   photoUri: string (backend: image_url or resolved to GET /image/{id})
   videoUri?: string (backend: video_url)
   onMyWayBy?: string[] (backend: on_my_way_by)
   resolvedBy?: string (backend: resolved_by)
   resolutionCode?: string (backend: resolution_code)
   is_active?: boolean
   timestamp / createdAt
}
```

Client ↔ backend normalization handled in `normalizePost()` and `buildPostPayload()`.

---
## Theming & Design Tokens
Full token documentation retained below (original section). Semantic category colors accessible via:
```ts
getCategorySemanticColor(mode, category)
getCategorySemanticBg(mode, category)
```
Used for badges, backgrounds, and foreground legibility.

---
## Development Workflow

| Task | Command |
|------|---------|
| Start app | `npx expo start` |
| Android build | `npm run android` |
| iOS build | `npm run ios` |
| Lint | `npm run lint` |
| Reset starter template | `npm run reset-project` |

### Mock vs Live API
- Toggle via `EXPO_PUBLIC_USE_MOCK_API`.
- Mock mode uses local JSON fixtures (`mock-data/`), bypasses network calls.

### Silent Refresh Pattern
Home & Map screens trigger `refreshPosts(true)` on focus: avoids spinner, merges new posts, improves perceived performance.

---
## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Post detail flickers | Loading state reset despite existing data | Background refresh logic added; ensure latest build running |
| Image not showing | Invalid numeric mapping or auth challenge | Confirm ID exists (`curl -I /image/{id}`) and env URL correct |
| Resolve fails | Missing resolution code or auth headers | Ensure Basic Auth active & provide photo + code |
| 405 on image | Wrong HTTP verb | Use GET only |
| "Not authenticated" | Missing/invalid Basic header | Verify credentials & Base64 encoding |

### Debug Tips
```bash
curl -X GET "$EXPO_PUBLIC_API_URL/posts/active/" -H "Authorization: Basic $(echo -n 'testuser:testpassword' | base64)"
curl -X POST "$EXPO_PUBLIC_API_URL/upload-image/1?post_id=1" -H "Authorization: Basic $(echo -n 'testuser:testpassword' | base64)" -F "file=@local.jpg"
```

---
## Security Notes
- Static Basic Auth is for development only; rotate or remove before release.
- Avoid embedding credentials in URLs (temporary workaround for image fetching). Replace with signed URLs or a token-based image proxy.
- Sanitize user-generated content if backend exposes rich text in future.

---
## Contributing
1. Branch from `main` (`feat/xyz-description`).
2. Ensure lint passes (`npm run lint`).
3. Keep patches focused (avoid unrelated formatting).
4. Open a PR with description & screenshots (map, post detail, resolve flow).

---
## Roadmap (Suggested)
- Token-based auth / refresh flow
- Offline queue for posts & resolves
- Real-time updates (WebSocket or SSE)
- Accessibility audit & high contrast theme toggle
- In-app analytics (privacy respecting)

---
## Original Expo Starter Docs

# Welcome to your Expo app 👋

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

---
_CivicMesh – Empowering communities through real-time collaboration._
