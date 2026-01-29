# Fix Sign-Up Issue - Run this script

Write-Host "🔧 Fixing Sign-Up Issue..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Generate Prisma Client
Write-Host "Step 1: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 2: Run Migrations
Write-Host "Step 2: Running database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run migrations" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database migrations completed" -ForegroundColor Green
Write-Host ""

# Step 3: Verify Database
Write-Host "Step 3: Verifying database..." -ForegroundColor Yellow
if (Test-Path "prisma\dev.db") {
    Write-Host "✅ Database file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database file not found, but migrations may have created it" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your dev server: npm run dev"
Write-Host "2. Go to: http://localhost:3000/auth/signin"
Write-Host "3. Enter any email and password (min 6 chars)"
Write-Host "4. Click 'Sign Up' - it should work now!"
Write-Host ""
