# Content Creator SaaS - Setup Script (PowerShell)

Write-Host "🚀 Setting up Content Creator SaaS Platform..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ .env file created. Please edit it with your API keys." -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file already exists. Skipping..." -ForegroundColor Yellow
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

# Generate Prisma client
Write-Host ""
Write-Host "🗄️  Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate

# Run migrations
Write-Host ""
Write-Host "🔄 Running database migrations..." -ForegroundColor Cyan
npx prisma migrate dev --name init

# Create uploads directory
Write-Host ""
Write-Host "📁 Creating uploads directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "public\uploads\videos" | Out-Null

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file with your API keys"
Write-Host "2. Run 'npm run dev' to start the development server"
Write-Host "3. Open http://localhost:3000 in your browser"
Write-Host ""
