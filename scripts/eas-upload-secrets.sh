#!/usr/bin/env bash
# Upload Firebase native config + optional release env vars to EAS (preview + production).
# Requires: eas login, and local files in myfirebase/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ANDROID_JSON="${1:-myfirebase/google-services.json}"
IOS_PLIST="${2:-myfirebase/GoogleService-Info.plist}"

if ! command -v eas >/dev/null 2>&1; then
  echo "Install EAS CLI: npm install -g eas-cli"
  exit 1
fi

for file in "$ANDROID_JSON" "$IOS_PLIST"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing $file — download from Firebase Console → Project settings → Your apps."
    exit 1
  fi
done

echo "Uploading Firebase file secrets to EAS (preview + production)…"

eas env:create \
  --name GOOGLE_SERVICES_JSON \
  --type file \
  --value "$ANDROID_JSON" \
  --environment preview \
  --environment production \
  --visibility secret \
  --force \
  --non-interactive

eas env:create \
  --name GOOGLE_SERVICE_INFO_PLIST \
  --type file \
  --value "$IOS_PLIST" \
  --environment preview \
  --environment production \
  --visibility secret \
  --force \
  --non-interactive

echo "Firebase file secrets uploaded."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# EXPO_PUBLIC_* vars are embedded in the app bundle — EAS rejects --visibility secret for them.
upload_public_env() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "Skipping $name (empty — set in .env first)"
    return 0
  fi

  eas env:create \
    --name "$name" \
    --value "$value" \
    --environment preview \
    --environment production \
    --visibility sensitive \
    --force \
    --non-interactive
  echo "Uploaded $name (sensitive)"
}

echo ""
echo "Uploading optional EXPO_PUBLIC_* vars from .env (non-fatal if skipped)…"

upload_public_env EXPO_PUBLIC_SENTRY_DSN "${EXPO_PUBLIC_SENTRY_DSN:-}"
upload_public_env EXPO_PUBLIC_FIREBASE_API_KEY "${EXPO_PUBLIC_FIREBASE_API_KEY:-}"
upload_public_env EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN "${EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:-}"
upload_public_env EXPO_PUBLIC_FIREBASE_PROJECT_ID "${EXPO_PUBLIC_FIREBASE_PROJECT_ID:-}"
upload_public_env EXPO_PUBLIC_FIREBASE_APP_ID "${EXPO_PUBLIC_FIREBASE_APP_ID:-}"
upload_public_env EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID "${EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-}"

echo ""
echo "Done. Verify:"
echo "  eas env:list --environment preview"
echo ""
echo "Then build:"
echo "  npm run build:android:preview"
