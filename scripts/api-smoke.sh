#!/usr/bin/env bash
set -euo pipefail
URL="https://api.theconnection.app/api/health"
echo "GET $URL"
curl -fsS -H 'Origin: https://www.theconnection.app' -D - "$URL" -o /dev/null | awk 'NR<=20'
echo "OK"
