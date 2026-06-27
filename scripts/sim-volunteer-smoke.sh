#!/usr/bin/env bash
set -euo pipefail

API="${EXPO_PUBLIC_API_URL:-http://127.0.0.1:8000}"
TENANT="${1:-tnf}"
EMAIL="${2:-b.afenya@gmail.com}"
PASSWORD="${3:-password}"

echo "== Login =="
TOKEN=$(curl -s -X POST "$API/api/v1/auth/login" \
  -H 'Content-Type: application/json' -H 'Accept: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"tenant_slug\":\"$TENANT\",\"device_name\":\"sim-smoke\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('token','')); assert d.get('data',{}).get('token'), d")

HDR=(-H "Authorization: Bearer $TOKEN" -H "X-Tenant-Slug: $TENANT" -H 'Accept: application/json')

check() {
  local name="$1" url="$2"
  code=$(curl -s -o /tmp/sim-smoke.json -w "%{http_code}" "${HDR[@]}" "$API$url")
  echo "[$code] $name"
  test "$code" -ge 200 && test "$code" -lt 300
}

echo "== Volunteer endpoints =="
check "Profile" "/api/v1/me/volunteer-profile"
check "Consent" "/api/v1/me/consent"
check "Feedback list" "/api/v1/me/feedback"
check "My projects" "/api/v1/projects/mine"
check "Community" "/api/v1/community/posts"
check "Notifications" "/api/v1/notifications"
check "Polls" "/api/v1/me/polls"
check "Dues" "/api/v1/me/dues"

echo "OK — volunteer API smoke passed for $EMAIL @ $TENANT"
