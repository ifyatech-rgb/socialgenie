#!/bin/bash

# Content Creator SaaS - Setup Script

echo "🚀 Setting up Content Creator SaaS Platform..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your API keys."
else
    echo "⚠️  .env file already exists. Skipping..."
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo ""
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Run migrations
echo ""
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init

# Create uploads directory
echo ""
echo "📁 Creating uploads directory..."
mkdir -p public/uploads/videos

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
