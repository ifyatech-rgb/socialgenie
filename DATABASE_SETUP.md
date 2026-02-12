# Fix: "the URL must start with postgresql:// or postgres://"

Your app uses **PostgreSQL** (not SQLite). You must set `DATABASE_URL` in `.env` to a PostgreSQL connection string.

## Steps

1. **Open your `.env` file** in the project root (same folder as `package.json`).

2. **Set or replace the `DATABASE_URL` line** with your **Supabase** (or other Postgres) URL:

   ```env
   DATABASE_URL="postgresql://postgres:YOUR_DB_PASSWORD@db.ejnqfxncywbgcstubrtq.supabase.co:5432/postgres"
   ```

   - Replace `YOUR_DB_PASSWORD` with your **Supabase database password** (the one you set when you created the project).
   - To get the exact URL: Supabase Dashboard → your project → **Settings** → **Database** → **Connection string** → **URI** → copy and paste into `.env`.

3. **Save `.env`** and **restart your dev server** (stop `npm run dev` and run it again).

4. **First time only:** create the tables in the database:

   ```bash
   npx prisma migrate dev --name init
   ```
   (Or use `npx prisma db push` for a quick sync without migration history.)

After that, sign-up and login should work and the error will go away.
