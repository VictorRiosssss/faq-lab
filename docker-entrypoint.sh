#!/bin/sh
set -e

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Ensuring the initial admin user exists..."
npx prisma db seed

echo "Starting Next.js..."
exec npm run start
