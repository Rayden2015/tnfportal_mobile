# Firebase setup (mobile)

Native Firebase config files contain Google API keys. **Do not commit them** — GitHub secret scanning will flag them, and anyone with repo access could misuse unrestricted keys.

## One-time local setup

1. Open [Firebase Console](https://console.firebase.google.com/) → project **tnf-portal**.
2. **Project settings** → **Your apps**.
3. Download:
   - **Android** → `google-services.json` → save as `myfirebase/google-services.json`
   - **iOS** → `GoogleService-Info.plist` → save as `myfirebase/GoogleService-Info.plist`
4. Copy `.env.example` to `.env` and fill `EXPO_PUBLIC_FIREBASE_*` from the same Firebase web app config (or your team secrets store).

Example templates (no secrets) live beside the real files:

- `myfirebase/google-services.json.example`
- `myfirebase/GoogleService-Info.plist.example`

## After keys were exposed in git

1. **Rotate / restrict keys** in [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**:
   - Restrict each key to **iOS apps** (bundle `com.infinixel.cipreengo`) or **Android apps** (package + signing SHA-1).
   - Limit APIs to Firebase / Google services you actually use.
   - Prefer creating new keys and re-downloading Firebase config files over leaving old keys active.
2. **Resolve GitHub alerts** after the rotated keys are in place and the real plist/json files are removed from the repo.
3. Optional: purge history with `git filter-repo` if the repo is public and you need old commits cleaned (requires force-push coordination).

## EAS / CI builds

Store `google-services.json` and `GoogleService-Info.plist` as EAS secrets or CI artifacts and copy them into `myfirebase/` before `expo prebuild` / native build — do not rely on them being in git.
