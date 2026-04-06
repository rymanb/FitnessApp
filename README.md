# fitness-app

A cross-platform fitness tracking and AI coaching mobile app built with Expo and React Native. Supports offline-first workout logging via local SQLite, cloud sync via a Go backend, and a Gemini-powered AI coach.

## Features

- **Dashboard** — workout consistency calendar, saved plans, quick-add
- **AI Coach** — multi-turn Gemini-powered coaching conversations
- **Stats** — progress charts and exercise analytics
- **History** — completed workouts with full exercise breakdowns
- **Offline-first** — all data stored locally in SQLite, synced to cloud when online
- **Google Sign-In** — OAuth authentication with JWT session management

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo 54 + React Native 0.81 |
| Routing | Expo Router (file-based) |
| State | Zustand |
| Local DB | expo-sqlite (SQLite) |
| Styling | NativeWind (Tailwind CSS) |
| Auth | Google Sign-In + JWT (stored in expo-secure-store) |
| Charts | react-native-gifted-charts |
| Calendar | react-native-calendars |

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`
- A running instance of the [fitness-backend](../fitness-backend)
- Google OAuth credentials (Web Client ID, iOS Client ID)

## Setup

```bash
cd fitness-app
npm install
```

Create a `.env` file in this directory:

```env
EXPO_PUBLIC_BACKEND_URL=http://<your-backend-host>:8080
EXPO_PUBLIC_WEB_CLIENT_ID=<Google OAuth Web Client ID>
EXPO_PUBLIC_IOS_CLIENT_ID=<Google OAuth iOS Client ID>
```

## Running

```bash
npm start           # Start Expo dev server
npm run android     # Run on Android emulator/device
npm run ios         # Run on iOS simulator (macOS only)
npm run web         # Run in browser
```

## Code Quality

```bash
npm run lint        # ESLint + Prettier check
npm run format      # Auto-fix formatting
```

## Building for Distribution

```bash
expo prebuild                        # Generate native ios/ and android/ directories
eas build --platform android         # Build Android APK/AAB
eas build --platform ios             # Build iOS IPA
eas submit                           # Submit to app stores
```

## Project Structure

```
src/
  app/                  # Expo Router screens
    (tabs)/             # Tab navigator screens (index, stats, coach, history)
    login.tsx
    profile.tsx
  components/           # Reusable UI components
  context/              # AuthContext, ThemeContext
  stores/               # Zustand state stores
  utils/                # Helpers, API client
assets/                 # Images, fonts
```

## Authentication Flow

1. User signs in with Google → receives a Google ID token
2. App exchanges the ID token with the backend at `POST /api/v1/auth/google`
3. Backend returns a 72-hour JWT
4. JWT stored securely via `expo-secure-store`
5. All API requests include `Authorization: Bearer <token>`
6. On app launch, silent token refresh is attempted via existing Google session

## Offline Sync

- Workouts and plans are written to local SQLite immediately
- Records are flagged `is_synced = false` until successfully pushed
- On reconnect, unsynced records are batched to `/*/sync` endpoints
- Soft deletes (`is_deleted` flag) are propagated to the server on sync
