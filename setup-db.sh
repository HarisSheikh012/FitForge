#!/usr/bin/env bash
set -e

echo "🚀 Setting up FitForge Clean Database..."

# 1. Start Postgres container
echo "📦 Starting PostgreSQL container on port 5439..."
docker compose up -d --force-recreate postgres

# 2. Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be healthy..."
until docker exec -i fitforge_postgres pg_isready -U fitforge >/dev/null 2>&1; do
  sleep 1
done

# 3. Grant schema ownership & superuser privileges
echo "🔑 Granting database and schema privileges to fitforge user..."
docker exec -i -e PGPASSWORD=fitforge_secret fitforge_postgres psql -U fitforge -d fitforge_db -c "ALTER USER fitforge WITH SUPERUSER CREATEDB; ALTER SCHEMA public OWNER TO fitforge; GRANT ALL ON SCHEMA public TO fitforge; GRANT ALL PRIVILEGES ON DATABASE fitforge_db TO fitforge;" >/dev/null 2>&1 || true
docker exec -i -e PGPASSWORD=fitforge_secret fitforge_postgres psql -U fitforge -d template1 -c "ALTER SCHEMA public OWNER TO fitforge; GRANT ALL ON SCHEMA public TO fitforge;" >/dev/null 2>&1 || true

# 4. Push Prisma schema directly (creates all tables, zero mock data)
echo "🔄 Creating database tables directly from schema..."
cd backend
npx prisma db push

echo ""
echo "✅ FitForge clean database is completely ready!"
echo "✨ No dummy or raw data was added."
echo "👉 You can now run the app and manually Sign Up and Sign In!"
