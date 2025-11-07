#!/usr/bin/env bash
set -euo pipefail
BASE_URL=${1:-http://localhost:5000/api}

# Health
curl -sS "${BASE_URL}/health" | jq . || true

# Magic auth
TOKEN=$(curl -sS -X POST "${BASE_URL}/mvp/auth/magic" -H 'Content-Type: application/json' -d '{"email":"review@theconnection.app"}' | jq -r '.token // empty')
echo "Magic token: $TOKEN"
# verify with known code 111222 for review@
JWT=$(curl -sS -X POST "${BASE_URL}/mvp/auth/verify" -H 'Content-Type: application/json' -d "{\"token\":\"$TOKEN\",\"code\":\"111222\"}" | jq -r '.token // empty')
echo "JWT: ${JWT:0:16}..."

# Feed
curl -sS "${BASE_URL}/feed" | jq '.[0] // {}' || true

# Apologetics
curl -sS "${BASE_URL}/apologetics" | jq length || true
