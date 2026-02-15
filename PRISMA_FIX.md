# Fix Prisma Errors (EPERM + prepared statement)

## Error 1: EPERM - "operation not permitted, rename query_engine-windows.dll.node"

**Cause:** The dev server (or another process) has the Prisma client locked.

**Fix:**
1. Stop the dev server (Ctrl+C in the terminal running `npm run dev`)
2. Close any other terminals or apps that might use Prisma
3. Run: `npx prisma generate`
4. Restart the dev server

---

## Error 2: "prepared statement 's0' already exists" (db push)

**Cause:** Supabase connection pooler (port 6543) doesn't support prepared statements used by Prisma migrations.

**Fix:** Add a **direct** database URL for migrations.

### Step 1: Get your direct connection string from Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **Settings** → **Database**
3. Find **Connection string** → **URI**
4. Copy the **Direct connection** (port **5432**, NOT the pooler 6543)
   - Example: `postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres`
   - Or: `postgresql://postgres:[PASSWORD]@db.[project-ref].supabase.co:5432/postgres`

### Step 2: Add to `.env`

```env
# Your existing pooler URL (for the app)
DATABASE_URL="postgresql://postgres:xxx@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# NEW: Direct URL for Prisma migrations (port 5432)
DIRECT_DATABASE_URL="postgresql://postgres:xxx@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
```

Replace `YOUR_PROJECT_REF` and the password with your actual Supabase values.

### Step 3: Run migrations

```powershell
npx prisma db push
npx prisma generate
```

---

## Alternative: Run SQL migration manually

If you can't add `DIRECT_DATABASE_URL`, add the columns manually:

1. Open Supabase Dashboard → **SQL Editor**
2. Run the contents of `prisma/migrations/add_script_refinement_columns.sql`
