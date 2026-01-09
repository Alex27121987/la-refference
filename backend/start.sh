#!/bin/bash

# Script de démarrage pour Render.com
echo "🚀 Starting deployment..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🔄 Running migrations..."
npx prisma migrate deploy

# Seed database if needed (optionnel)
# echo "🌱 Seeding database..."
# npm run seed

# Start the server
echo "✅ Starting server..."
npm run start
