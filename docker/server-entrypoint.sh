#!/bin/sh
set -e

echo "Applying database migrations..."
until npx prisma migrate deploy; do
  echo "Database not ready — retrying in 3s..."
  sleep 3
done

echo "Seeding database..."
npx prisma db seed || true

echo "Starting API..."
exec node server/src/server.js
