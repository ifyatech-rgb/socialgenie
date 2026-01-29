# 🔧 Troubleshooting Guide - Site Not Opening

## Quick Fixes

### 1. Check if Dev Server is Running

**Windows PowerShell:**
```powershell
cd "c:\Users\SAMSUNG\OneDrive\Desktop\SAAS"
npm run dev
```

**What to look for:**
- Should see: "Ready - started server on 0.0.0.0:3000"
- If you see errors, check the error messages below

### 2. Common Errors & Solutions

#### Error: "Cannot find module"
**Solution:**
```powershell
npm install
```

#### Error: "Port 3000 is already in use"
**Solution:**
- Close other applications using port 3000
- Or change port: `npm run dev -- -p 3001`

#### Error: "Prisma Client not generated"
**Solution:**
```powershell
npx prisma generate
```

#### Error: "Database not found"
**Solution:**
```powershell
npx prisma migrate dev --name init
```

### 3. Clear Cache and Rebuild

If nothing works, try:
```powershell
# Delete cache folders
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Reinstall dependencies
npm install

# Restart dev server
npm run dev
```

### 4. Check Browser

1. **Open:** http://localhost:3000
2. **If blank page:**
   - Open browser console (F12)
   - Check for errors in Console tab
   - Check Network tab for failed requests

### 5. Verify Files

Make sure these files exist:
- ✅ `app/page.tsx` - Landing page
- ✅ `app/layout.tsx` - Root layout
- ✅ `app/globals.css` - Global styles
- ✅ `package.json` - Dependencies
- ✅ `.env` - Environment variables (optional for basic setup)

### 6. Check Environment Variables

Minimum required in `.env`:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

### 7. Step-by-Step Startup

1. **Navigate to project:**
   ```powershell
   cd "c:\Users\SAMSUNG\OneDrive\Desktop\SAAS"
   ```

2. **Install dependencies (if not done):**
   ```powershell
   npm install
   ```

3. **Generate Prisma client:**
   ```powershell
   npx prisma generate
   ```

4. **Run migrations:**
   ```powershell
   npx prisma migrate dev --name init
   ```

5. **Start dev server:**
   ```powershell
   npm run dev
   ```

6. **Open browser:**
   - Go to: http://localhost:3000
   - Should see the landing page

### 8. Still Not Working?

**Check the terminal output:**
- Look for error messages
- Check if port 3000 is available
- Verify Node.js version: `node --version` (should be 18+)

**Common Issues:**
- ❌ Port 3000 already in use → Use different port or close other apps
- ❌ Missing dependencies → Run `npm install`
- ❌ Database error → Run Prisma migrations
- ❌ Syntax error → Check terminal for specific file/line

### 9. Get Help

If you see a specific error message:
1. Copy the full error message
2. Check which file it's in
3. Look at the line number mentioned
4. Share the error for help

## Expected Output

When `npm run dev` works correctly, you should see:
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Ready in 2.5s
```

Then open http://localhost:3000 in your browser!
