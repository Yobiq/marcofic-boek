### 🎵 Artist Tour Management – Mobile App (Expo)

A modern, professional mobile app built with Expo (React Native) for artists to manage tours, bookings, itineraries, chat/contacts, notifications, and profile. Beautiful drawer (hamburger) navigation, itinerary-first UX, and secure integration with a Laravel backend.

---

## ✨ Highlights

- **Itinerary-first UX**: Focus on travel and schedule; no booking creation in v1
- **Drawer UI**: Clean, professional hamburger menu navigation
- **Secure auth**: Laravel Sanctum/JWT; tokens stored in SecureStore
- **Real-time**: Laravel Echo + Pusher/Reverb; push notifications via Expo
- **Offline-ready**: React Query caching with background refresh
- **PDFs**: Download contracts via signed URLs, view in app
- **Artist-scoped data**: Enforced via Laravel policies

---

## 🧱 Architecture

- Frontend: Expo SDK 51+, React Native 0.74+, TypeScript
- Navigation: React Navigation v6 (Drawer + Stack)
- Data: TanStack Query (React Query)
- Storage/Security: Expo SecureStore
- HTTP: Axios with interceptors
- Realtime: Laravel Echo + Pusher/Reverb (fallback to polling)
- Files: Expo FileSystem + WebView
- Optional: Zod (response validation), Sentry (crash reporting)

---

## 📂 Project Structure

```
frontend/
├── App.tsx
├── app.config.ts (or app.json)
├── babel.config.js
├── package.json
├── src/
│   ├── screens/
│   │   ├── CalendarScreen.tsx
│   │   ├── BookingsScreen.tsx
│   │   ├── ItineraryScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── LoginScreen.tsx
│   ├── components/ (Drawer, UI atoms)
│   ├── services/
│   │   ├── api.ts         (Axios + interceptors)
│   │   ├── auth.ts        (login/logout/me)
│   │   ├── artist.ts      (calendar/bookings/itinerary/contacts/profile)
│   │   └── files.ts       (signed URL PDF download)
│   ├── hooks/             (React Query hooks)
│   ├── providers/         (QueryClient, AuthContext)
│   ├── types/             (shared TS types)
│   └── utils/             (format/date/linking)
└── README.md
```

---

## 🧭 Navigation and Screens

- Drawer items with subtitle and counts:
  - 📅 Calendar — "Upcoming events & performances" (12)
  - 📋 Bookings — "Manage your contracts" (8)
  - 🗺️ Itinerary — "Travel & schedule details" (3)
  - 💬 Chat & Contacts — "Team communication" (5)
  - 🔔 Notifications — "Updates & alerts" (15)
  - 👤 Profile — "Artist information"
  - ⚙️ Settings — "App preferences"
- Drawer interactions:
  - Tap hamburger to open
  - Swipe from left to open
  - Tap outside or swipe to close
  - Auto-close after navigating

---

## 🔌 Backend Integration

- API: Laravel (Sanctum PATs or JWT)
- Authorization: Bearer token
- Artist scope: Only data where artist_id matches current user
- Realtime: Echo → private-artist-{id}, private-thread-{id}
- Files: Contracts served via short-lived signed URLs

---

## ⚙️ Environment

- Network base URL per target:
  - iOS Simulator: `http://127.0.0.1:8000`
  - Android Emulator: `http://10.0.2.2:8000`
  - Physical device: `http://YOUR_LAN_IP:8000` (ensure same Wi-Fi; allow LAN)

- .env for Expo (app.config.ts reads from process.env):
  - EXPO_PUBLIC_API_BASE_URL
  - EXPO_PUBLIC_APP_SCHEME (e.g., `ontourly`)
  - Optional: EXPO_PUBLIC_SENTRY_DSN, EXPO_PUBLIC_FEATURE_FLAGS

- Deep linking (app.config.ts):
```ts
export default {
  expo: {
    scheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'ontourly',
    platforms: ['ios','android','web'],
    ios: { supportsTablet: true },
    android: { package: 'com.ontourly.artist' },
  }
}
```

---

## 🚀 Getting Started

- Prereqs: Node 18+, Xcode/Android Studio, Expo CLI, device emulator or Expo Go
- Install
```bash
cd /Users/eyobielgoitom/Desktop/frontend
npm install
```
- Start
```bash
npx expo start --clear
# i = iOS, a = Android, w = web, or scan QR in Expo Go
```
- Configure API base URL:
```bash
# iOS simulator
export EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
# Android emulator
export EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api
# Physical device
export EXPO_PUBLIC_API_BASE_URL=http://YOUR_LAN_IP:8000/api
```

---

## 🔐 Authentication

- Login endpoint issues a token (Sanctum PATs or JWT)
- Token stored in SecureStore
- Interceptor attaches Authorization header

```ts
// src/services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});
api.interceptors.request.use(async (cfg) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
```

```ts
// src/services/auth.ts
import { api } from './api';
export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  return data.token as string;
}
export async function me() {
  const { data } = await api.get('/me');
  return data;
}
```

---

## 🔁 React Query

- Provider and sensible defaults
```tsx
// src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const client = new QueryClient();
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

---

## 🧭 Drawer Scaffold

```tsx
// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import CalendarScreen from './src/screens/CalendarScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import ItineraryScreen from './src/screens/ItineraryScreen';
import ChatScreen from './src/screens/ChatScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Drawer = createDrawerNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator>
        <Drawer.Screen name="Calendar" component={CalendarScreen} />
        <Drawer.Screen name="Bookings" component={BookingsScreen} />
        <Drawer.Screen name="Itinerary" component={ItineraryScreen} />
        <Drawer.Screen name="Chat & Contacts" component={ChatScreen} />
        <Drawer.Screen name="Notifications" component={NotificationsScreen} />
        <Drawer.Screen name="Profile" component={ProfileScreen} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
```

---

## 📊 API Endpoints (Artist scope)

- Auth
  - POST `/api/auth/login`
  - POST `/api/auth/logout`
  - GET `/api/me`

- Calendar
  - GET `/api/artist/calendar?from=YYYY-MM-01&to=YYYY-MM-31`

- Bookings (read-first)
  - GET `/api/artist/bookings`
  - GET `/api/artist/bookings/{id}`
  - GET `/api/bookings/{id}/contracts`
  - GET `/api/contracts/{id}`
  - GET `/api/contracts/{id}/pdf` → returns `{ signedUrl }` or binary

- Itinerary (primary)
  - GET `/api/bookings/{id}/itinerary`
  - GET `/api/tours/{id}/itinerary`
  - POST `/api/itinerary-items/{id}/check-in` (optional)

- Contacts / Chat
  - GET `/api/artist/contacts`
  - GET `/api/chat/threads`
  - GET `/api/chat/threads/{id}`
  - POST `/api/chat/messages`

- Notifications
  - GET `/api/notifications`
  - POST `/api/notifications/read`
  - PATCH `/api/devices` → `{ expoPushToken }`

- Profile
  - GET `/api/artist/profile`
  - PUT `/api/artist/profile`

---

## 📄 PDFs

- Download via signed URLs (short TTL)
- In app:
```ts
// src/services/files.ts
import * as FileSystem from 'expo-file-system';
export async function downloadPdf(signedUrl: string, fileName: string) {
  const dest = FileSystem.documentDirectory + fileName;
  const res = await FileSystem.downloadAsync(signedUrl, dest);
  return res.uri; // open in WebView or share
}
```

---

## 🔔 Push Notifications

- Request permissions → obtain Expo push token
- Send token to backend:
```ts
await api.patch('/devices', { expoPushToken });
```
- Payload types: booking.updated, itinerary.updated, chat.message, contract.signed
- Deep link from pushes to relevant screen (configure scheme/prefix)

---

## 🔒 Security

- HTTPS in production
- Tokens in SecureStore
- Artist-scoped access in backend policies
- No PII in logs
- Rate-limit chat and notification endpoints

---

## 📶 Offline & Performance

- Cache key data (me, calendar month, upcoming bookings/itineraries)
- Background refetch on focus/network reconnect
- Virtualized lists, memoized rows
- Minimal image sizes and caching

---

## 🧪 Testing

- Unit: Jest + React Native Testing Library
- E2E: Detox (login, calendar month, itinerary detail, contract PDF open)
- Optional: Zod schemas for API validation

---

## 🧰 Scripts

```bash
npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web
```

---

## 🔧 Troubleshooting

- Metro cache:
```bash
npx expo start --clear
```
- iOS Simulator not opening:
```bash
npx expo run:ios
```
- Android build issues:
```bash
npx expo run:android
```
- API not reachable:
  - Confirm correct EXPO_PUBLIC_API_BASE_URL (per platform)
  - Backend up at `http://localhost:8000`
  - For device testing, use LAN IP and allow network access

---

## 👤 Default Test Login

- Email: `jane@example.com`
- Password: `password`

---

## 📦 Dependencies (core)

```json
{
  "@expo/vector-icons": "^14.0.0",
  "@react-navigation/drawer": "^6.6.15",
  "@react-navigation/native": "^6.1.17",
  "@tanstack/react-query": "^5.28.6",
  "axios": "^1.6.8",
  "expo": "~51.0.8",
  "expo-secure-store": "~13.0.1",
  "react": "18.2.0",
  "react-native": "0.74.1",
  "react-native-gesture-handler": "~2.16.1",
  "react-native-reanimated": "~3.10.1",
  "react-native-safe-area-context": "4.10.1",
  "react-native-screens": "3.31.1"
}
```

---

## 🚀 Deployment (EAS)

- Install EAS:
```bash
npm i -g eas-cli
```
- Configure:
```bash
eas build:configure
```
- Build:
```bash
eas build --platform all
```

---

## 🤝 Contributing

- Fork → feature branch → PR. Keep components small, typed, and accessible.

---

Last updated: August 2025