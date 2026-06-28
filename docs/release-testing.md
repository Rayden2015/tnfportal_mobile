# Release & tester distribution

Production API for all release builds: **`https://ngo.cipree.com`**

Configured in `eas.json` (`preview` + `production` profiles) and baked in at build time via `EXPO_PUBLIC_API_URL`. Local dev stays on `http://localhost:8000` via `.env`.

---

## One-time setup

### 1. Firebase native config (local + EAS)

```bash
# Download from Firebase Console → tnf-portal → Project settings → Your apps
# Save as:
#   myfirebase/google-services.json
#   myfirebase/GoogleService-Info.plist

cp .env.example .env
# Fill EXPO_PUBLIC_FIREBASE_* and EXPO_PUBLIC_SENTRY_DSN
```

### 2. EAS login & project link

```bash
npm install -g eas-cli
eas login
eas init    # links Expo project if not done yet
```

### 3. Upload secrets for cloud builds

Cloud builders do not have your gitignored Firebase files. Upload once:

```bash
chmod +x scripts/eas-upload-secrets.sh
./scripts/eas-upload-secrets.sh
```

This stores file secrets `GOOGLE_SERVICES_JSON` and `GOOGLE_SERVICE_INFO_PLIST` plus string secrets from `.env`. `app.config.js` copies them into `myfirebase/` automatically during EAS build.

Verify:

```bash
eas env:list --environment preview
eas env:list --environment production
```

You should see **file** variables `GOOGLE_SERVICES_JSON` and `GOOGLE_SERVICE_INFO_PLIST`.

### 4. Apple (TestFlight)

- Apple Developer account enrolled
- App Store Connect app for bundle ID `com.infinixel.cipreengo`
- Fill `eas.json` → `submit.production.ios` (`appleId`, `ascAppId`, `appleTeamId`) or pass flags on first submit

---

## Build commands

| Goal | Command |
|------|---------|
| Android APK (Firebase App Distribution) | `npm run build:android:preview` |
| iOS internal IPA (Firebase App Distribution) | `npm run build:ios:preview` |
| iOS TestFlight / App Store | `npm run build:ios:production` then `npm run submit:ios` |
| Android Play internal track | `npm run build:android:production` |

---

## TestFlight (iOS)

```bash
npm run build:ios:production
npm run submit:ios
```

In **App Store Connect → TestFlight**:

1. Add **Internal testers** (team members, instant)
2. Add **External testers** (requires Beta App Review, ~24h first time)

Testers install via the **TestFlight** app. Builds use `https://ngo.cipree.com`.

---

## Firebase App Distribution

Works well for quick Android APK sharing; iOS works with ad-hoc/internal IPA from EAS.

### Android

```bash
npm run build:android:preview
```

1. Open [Firebase Console](https://console.firebase.google.com/) → **tnf-portal** → **App Distribution**
2. Select Android app `com.infinixel.cipreengo`
3. Upload the APK from the EAS build page
4. Add tester emails → they receive an install link

### iOS

```bash
npm run build:ios:preview
```

1. Download the `.ipa` from the EAS build page
2. Firebase → App Distribution → iOS app → upload IPA
3. Invite testers (must be registered UDIDs for ad-hoc, or use TestFlight for wider distribution)

**Recommendation:** use **TestFlight** for iOS beta; use **Firebase App Distribution** for Android APK.

---

## Maintaining the production endpoint

| What | Where | Value |
|------|--------|--------|
| Local dev | `.env` | `EXPO_PUBLIC_API_URL=http://localhost:8000` |
| Preview / Test builds | `eas.json` → `preview.env` | `https://ngo.cipree.com` |
| App Store / Play | `eas.json` → `production.env` | `https://ngo.cipree.com` |

**To change production URL:** edit `eas.json`, then **rebuild** — the URL is compiled into the binary.

Optional override without editing git:

```bash
eas env:create --name EXPO_PUBLIC_API_URL --value https://ngo.cipree.com \
  --environment preview --environment production --visibility plaintext --force
```

---

## Troubleshooting

### Android: `google-services.json is missing`

The file is gitignored (correct). EAS cloud builds need file secrets uploaded first:

```bash
npm run eas:secrets
eas env:list --environment preview   # confirm GOOGLE_SERVICES_JSON appears
npm run build:android:preview
```

### iOS: `Developer Program Membership Expired`

Renew at [developer.apple.com/account](https://developer.apple.com/account) (Account Holder role). Also resolve **App Store Connect agreement** updates and **EU trader status** in App Store Connect before iOS/TestFlight builds succeed. Use **Android preview** for testing while Apple account is renewed.

---

## Pre-flight checklist

- [ ] Firebase API keys rotated after GitHub secret alert
- [ ] `./scripts/eas-upload-secrets.sh` completed successfully
- [ ] `ngo.cipree.com` deployed with latest `tnfportal_web`
- [ ] Login tested on prod tenant (e.g. slug `tnf`)
- [ ] Push notifications tested on EAS build (not Expo Go)
