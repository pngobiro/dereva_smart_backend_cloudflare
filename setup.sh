#!/bin/bash

# Dereva Smart Backend Setup Script
# Run this to set up all Cloudflare resources

echo "🚀 Setting up Dereva Smart Backend on Cloudflare..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if logged in to Cloudflare
echo "🔐 Checking Cloudflare authentication..."
wrangler whoami || {
    echo "Please login to Cloudflare:"
    wrangler login
}

# Create D1 Database
echo "📊 Creating D1 database..."
wrangler d1 create dereva-db

echo ""
echo "⚠️  IMPORTANT: Copy the database_id from above and update wrangler.toml"
echo "Press Enter when done..."
read

# Create R2 Bucket
echo "🪣 Creating R2 bucket for media..."
wrangler r2 bucket create dereva-media

# Create KV Namespaces
echo "🗄️  Creating KV namespaces..."
wrangler kv:namespace create "CACHE"
echo ""
echo "⚠️  IMPORTANT: Copy the id from above and update wrangler.toml [[kv_namespaces]] CACHE"
echo "Press Enter when done..."
read

wrangler kv:namespace create "SESSIONS"
echo ""
echo "⚠️  IMPORTANT: Copy the id from above and update wrangler.toml [[kv_namespaces]] SESSIONS"
echo "Press Enter when done..."
read

# Run migrations locally
echo "🔄 Running database migrations locally..."
wrangler d1 migrations apply dereva-db --local

# Run migrations remotely
echo "🌍 Running database migrations remotely..."
wrangler d1 migrations apply dereva-db --remote

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update wrangler.toml with all the IDs you copied"
echo "2. Run 'npm run dev' to start local development"
echo "3. Run 'npm run deploy' to deploy to production"
echo ""
echo "Your API will be available at:"
echo "  Local: http://localhost:8787"
echo "  Production: https://dereva-smart-backend.YOUR_SUBDOMAIN.workers.dev"
