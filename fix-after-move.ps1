# Fix project after moving from OneDrive to local C drive
# Run this in PowerShell FROM THE PROJECT FOLDER (C:\SAAS)
# Close Cursor/VS Code and any "npm run dev" or Node processes first!

$ErrorActionPreference = "Continue"

Write-Host "Step 1: Removing node_modules..." -ForegroundColor Cyan
if (Test-Path node_modules) {
    cmd /c "rmdir /s /q node_modules"
    if (Test-Path node_modules) {
        Write-Host "  Could not remove node_modules - close Cursor, terminals, and any Node processes, then run this script again." -ForegroundColor Yellow
        exit 1
    }
}
Write-Host "  Done." -ForegroundColor Green

Write-Host "Step 2: Removing .next..." -ForegroundColor Cyan
if (Test-Path .next) { cmd /c "rmdir /s /q .next" }
Write-Host "  Done." -ForegroundColor Green

Write-Host "Step 3: Removing lock files..." -ForegroundColor Cyan
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Force yarn.lock -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue
Write-Host "  Done." -ForegroundColor Green

Write-Host "Step 4: Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed." -ForegroundColor Red; exit 1 }
Write-Host "  Done." -ForegroundColor Green

Write-Host "Step 5: Regenerating Prisma client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Host "prisma generate failed." -ForegroundColor Red; exit 1 }
Write-Host "  Done." -ForegroundColor Green

Write-Host "`nAll done! Start the project with: npm run dev" -ForegroundColor Green
