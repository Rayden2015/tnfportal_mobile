# TNF Portal Mobile

Cross-platform mobile app (iOS + Android) for [TNF Portal](../tnfportal_web), built with **Expo** and **React Native**. It consumes the **Mobile API v1** documented in Postman (`tnfportal_web/postman/tnfportal-mobile-api-v1.postman_collection.json`).

## Features (v1)

| Area | Volunteer | Staff (admin/coordinator) |
|------|-----------|---------------------------|
| Auth | Login with tenant slug + Sanctum bearer token; sign out all devices | Same |
| Home | Dashboard summary | Dashboard summary |
| Projects | Assigned projects — tap for check-in, RSVP, feedback, contribute | All projects + create/edit, bulk check-in roster |
| Community | Posts, team directory, notifications (badge on tab) | Same |
| More | Check-in, polls, giving, feedback, consent, dues, settings | Attendance, polls, finance, messages, settings |
| Profile | Dues status, volunteer profile, account actions | Account info + settings |

## Prerequisites

- Node.js 20+
- [Expo Go](https://expo.dev/go) on a device, or Xcode / Android Studio for simulators
- TNF Portal API running locally or on a reachable host

### Backend setup (local)

```bash
cd ../tnfportal_web
php artisan serve

# Provision tenant + sample data (projects, volunteers, donors, attendance, etc.)
php artisan regression:tenant --reset
```

**Test credentials** (tenant slug must match exactly)

| Role | Organization slug | Email | Password |
|------|-------------------|-------|----------|
| Admin | `ganaa-regression` | `regression@tnfportal.test` | `password` |
| Volunteer | `ganaa-regression` | `volunteer.poll@test.local` | `password` |
| Tenant admin (main seeder) | `tnf` | `tenant@tnf.org` | `password` (local) / `tenant123` (if seeded for prod) |

If login says **“These credentials do not match our records”**, the user does not exist for that **tenant slug**. Run `php artisan regression:tenant --reset` to create/refresh the `ganaa-regression` admin account.

## Install & run

```bash
cd tnfportal_mobile
cp .env.example .env
npm install
npm start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

### iOS simulator timeout (`simctl openurl` / code 60)

This usually means Metro opened on a **second port** while an old server is still running, or the simulator wasn’t ready for the LAN URL.

1. Stop all Expo/Metro processes (close other terminal tabs running `expo start`).
2. Kill anything still on port 8081:
   ```bash
   lsof -ti :8081 | xargs kill -9
   ```
3. Open Simulator first: **Xcode → Open Developer Tool → Simulator**, wait until the home screen appears.
4. Start with localhost (recommended for simulator):
   ```bash
   npm run ios
   ```
   Or manually: `npx expo start --lan --ios`.

   On some Mac setups, `--localhost` binds Metro to IPv6 only (`::1`) while the simulator requests `127.0.0.1`, which causes a red “Could not connect to development server” screen. Use `--lan` instead.

If it still fails, open **Expo Go** inside the simulator and enter the URL shown in the terminal (e.g. `exp://127.0.0.1:8081`).

### API URL per environment

| Target | `EXPO_PUBLIC_API_URL` |
|--------|------------------------|
| iOS Simulator | `http://localhost:8000` |
| Android Emulator | `http://10.0.2.2:8000` |
| Physical device | `http://<your-lan-ip>:8000` |

## Project structure

```
tnfportal_mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/login.tsx    # Sign in
│   └── (app)/(tabs)/       # Main app tabs
├── src/
│   ├── api/                # Typed API client (mirrors Postman collection)
│   ├── config.ts           # API URL + tenant defaults
│   └── context/            # Auth session (SecureStore)
└── components/ui.tsx       # Shared UI primitives
```

## API alignment

All v1 endpoints from the Postman collection are wrapped in `src/api/index.ts`:

- `POST /api/v1/auth/login`, `logout`, `logout-all`
- `GET /api/v1/me`
- Projects: `index`, `mine`, `show`, create/update/delete, program types, roster, bulk check-in, contribute
- `GET/POST /api/v1/messages`, `GET /api/v1/message-templates`
- Volunteers: `index`, `show`
- Attendance (admin + self-service)
- Notifications + preferences
- `GET/POST /api/v1/me/polls`, poll responses
- `GET /api/v1/me/donations`, `GET /api/v1/donations`, `GET /api/v1/expenses`
- `POST /api/v1/projects/{id}/contribute`
- `GET/POST /api/v1/me/dues`, push token registration
- `GET/PUT /api/v1/me/volunteer-profile`, photo upload/delete
- `GET/POST /api/v1/me/consent`, `PUT /api/v1/me/password`
- `GET/POST /api/v1/me/feedback`, project feedback forms
- `GET/POST /api/v1/me/projects/{id}/interest` (RSVP)
- `GET/POST /api/v1/community/posts`, comments

Authenticated requests send:

- `Authorization: Bearer <token>`
- `X-Tenant-Slug: <tenant-slug>`
- `Accept: application/json`

## Building for stores

```bash
# Install EAS CLI once
npm install -g eas-cli

# Link project (first time only — creates EAS project ID for push tokens)
eas init

# Configure and build
eas build:configure
eas build --profile preview --platform android   # internal APK
eas build --profile production --platform ios    # TestFlight
eas build --profile production --platform android
```

Update `EXPO_PUBLIC_API_URL` in `eas.json` production profile (or EAS secrets) before release builds.

See **`docs/release-testing.md`** for TestFlight, Firebase App Distribution, EAS secrets upload, and keeping `https://ngo.cipree.com` as the production API.

### Offline check-in

When a volunteer check-in fails due to connectivity, the app queues it locally (`AsyncStorage`) and auto-syncs when the network returns. Pending items appear on the Check-in tab with a manual **Sync now** button.

### Push notifications

The app requests notification permission on login and obtains an Expo push token. Tokens are registered via `POST /api/v1/me/push-token` on the backend.

**Expo Go warning (expected):** Starting with SDK 53, remote push is **not supported in Expo Go**. You may see a console warning like `expo-notifications functionality is not fully supported in Expo Go` — that is normal during development. Login, projects, attendance, and the rest of the app work fine. For real push testing, create an [EAS development build](https://docs.expo.dev/develop/development-builds/introduction/):

```bash
eas build --profile development --platform ios
```

## Next phases

- Biometric device integration (hardware-specific)
- Full web parity for admin modules (donors CRUD, beneficiaries, assets, billing, etc.)
# tnfportal_mobile
