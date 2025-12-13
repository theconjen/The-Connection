#!/usr/bin/env bash
set -euo pipefail

# Starts a temporary Postgres container, runs migrations, runs API tests,
# then stops & removes the container. Intended for local CI-style runs.

CONTAINER_NAME=tc-test-postgres
POSTGRES_USER=tc_test
POSTGRES_PASSWORD=tc_test_pw
POSTGRES_DB=tc_test_db
POSTGRES_VERSION=15-alpine

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: 'docker' not found in PATH."
  echo "Install Docker Desktop (macOS) or ensure Docker Engine is available, then re-run this script."
  echo "Alternatively you can start a local Postgres with Homebrew and set DATABASE_URL/USE_DB environment variables manually."
  exit 1
fi

echo "Starting temporary Postgres container (${CONTAINER_NAME})..."
docker run --name "${CONTAINER_NAME}" -e POSTGRES_USER="${POSTGRES_USER}" \
  -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" -e POSTGRES_DB="${POSTGRES_DB}" \
  -p 5432:5432 -d postgres:${POSTGRES_VERSION} > /dev/null

echo "Waiting for Postgres to accept connections..."
# Wait until pg_isready inside the container reports OK
for i in $(seq 1 30); do
  if docker exec "${CONTAINER_NAME}" pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; then
    echo "Postgres is ready"
    break
  fi
  echo "  waiting... ($i)"
  sleep 1
done

if ! docker exec "${CONTAINER_NAME}" pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; then
  echo "Postgres did not become ready in time"
  docker logs "${CONTAINER_NAME}" || true
  docker rm -f "${CONTAINER_NAME}" || true
  exit 1
fi

# Export DATABASE_URL for migrations and tests
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}"
export USE_DB=true

echo "Running server migrations..."
# Use pnpm to invoke tsx inside the server package
pnpm -C server exec tsx server/run-migrations-runner.ts

echo "Running API tests against test DB..."
pnpm run test:api || TEST_STATUS=$?

echo "Stopping and removing Postgres container..."
docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true

if [ -n "${TEST_STATUS-}" ]; then
  echo "Tests failed (exit ${TEST_STATUS})."
  exit ${TEST_STATUS}
fi

echo "All done — tests passed against temporary DB."
