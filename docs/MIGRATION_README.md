# Database cleanup & migration – safe procedure

This doc describes how to run the **backup → migrate → verify → cleanup** flow with **zero data loss**. The app’s current schema stays in place; new tables are added and filled in parallel.

---

## Important

- **Do not** replace `prisma/schema.prisma` with `schema-new.prisma` until you have:
  - Run the migration script
  - Verified data in the new tables
  - Decided to switch the app to the new schema and updated all code
- Current DB has **User**, **Script**, **GeneratedVideo**, **Avatar** (no **Project**). Data is mapped as:
  - **User** → **users**
  - **Script** → **scripts**
  - **GeneratedVideo** → **videos**
  - **Avatar** → **avatars**

---

## Execution order

Run in this order.

### 1. Backup the database

```bash
# From project root; requires DATABASE_URL in .env
pg_dump "$DATABASE_URL" > backup-before-migration.sql
```

Keep this file safe. You can restore with:

```bash
psql "$DATABASE_URL" < backup-before-migration.sql
```

### 2. Apply current schema (no change)

Ensure migrations are up to date for the **current** schema:

```bash
npx prisma generate
# If you use migrations:
# npx prisma migrate deploy
```

### 3. Run the migration script (backup + copy)

**Windows / ESM:** Use the `.mjs` script (uses Prisma client for backup, parameterized inserts):

```bash
node scripts/migrate-database.mjs
# or
npm run migrate-db
```

**Alternative (CommonJS):** `node scripts/migrate-database.js` — uses raw SQL backup and escape.

This script:

- Backs up **User**, **Script**, **GeneratedVideo**, **Avatar** to a JSON file
- Creates new tables **users**, **scripts**, **videos**, **avatars**, **analytics** (if they don’t exist)
- Copies all rows into the new tables with the correct field mapping
- Does **not** drop or alter the original tables

You should see:

- Backup path (e.g. `backup-<timestamp>.json`)
- Row counts for each new table
- A short verification summary

### 4. Verify in the database

Check that counts and data look right:

```sql
-- Example (adjust to your DB client)
SELECT 'User' AS tbl, COUNT(*) FROM "User"
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'GeneratedVideo', COUNT(*) FROM "GeneratedVideo"
UNION ALL SELECT 'videos', COUNT(*) FROM videos
UNION ALL SELECT 'Script', COUNT(*) FROM "Script"
UNION ALL SELECT 'scripts', COUNT(*) FROM scripts
UNION ALL SELECT 'Avatar', COUNT(*) FROM "Avatar"
UNION ALL SELECT 'avatars', COUNT(*) FROM avatars;
```

Spot-check a few rows in **users**, **videos**, **scripts**, **avatars** (e.g. by id or email).

### 5. (Optional) Clean up old tables **only** when ready

Run this **only after** you are sure the new tables are correct and you no longer need the old ones for the app or for rollback.

By default the script drops only **GeneratedVideo** (replaced by **videos**). It does **not** drop **User**, **Script**, or **Avatar** until you have switched the app to the new schema and, if needed, updated FKs.

```bash
node scripts/cleanup-old-tables.js
# Type "yes" when prompted
```

To drop more old tables later, you would need to:

- Update the app and Prisma schema to use **users**, **scripts**, **avatars**
- Resolve foreign keys (new tables currently reference **User** and **Script**)
- Then add the corresponding `DROP TABLE` statements in `scripts/cleanup-old-tables.js` and run it again (with a new backup before that).

---

## Verification checklist

After running the migration script, confirm:

### Data

- [ ] Backup JSON file exists and contains expected tables and row counts
- [ ] `users` row count matches **User**
- [ ] `videos` row count matches **GeneratedVideo**
- [ ] `scripts` row count matches **Script**
- [ ] `avatars` row count matches **Avatar**
- [ ] Spot-check a few users/videos/scripts/avatars in the new tables

### App (still on current schema)

- [ ] Login works
- [ ] User profile and credits load
- [ ] Video generation and history work
- [ ] Avatars and scripts load as before
- [ ] Dashboard and stats load without errors

### After cleanup (if you ran it)

- [ ] App still works (only **GeneratedVideo** should be dropped by default)
- [ ] No runtime errors referring to missing tables

---

## Files involved

| File | Purpose |
|------|--------|
| `prisma/schema-new.prisma` | New clean schema (reference). Do not replace `schema.prisma` with this until you are ready to switch the app. |
| `scripts/migrate-database.js` | Backup + create new tables + copy data. Safe to run; does not drop old tables. |
| `scripts/cleanup-old-tables.js` | Drops old table(s) after confirmation. Default: only **GeneratedVideo**. |
| `docs/MIGRATION_README.md` | This file. |

---

## Rollback

If something goes wrong **before** you run cleanup:

- Original tables are still there; the app keeps using them.
- New tables (**users**, **videos**, **scripts**, **avatars**, **analytics**) can be dropped manually if you want to re-run the migration later.

If you already ran cleanup and need to restore:

```bash
psql "$DATABASE_URL" < backup-before-migration.sql
```

(Use the `backup-before-migration.sql` from step 1.)

---

## Summary

- **Backup first** (pg_dump + migration script’s JSON backup).
- **Migrate** = create new tables + copy data; old tables unchanged.
- **Verify** counts and app behavior.
- **Cleanup** only when you’re sure; by default only **GeneratedVideo** is dropped.
- **Full cutover** to **users** / **scripts** / **avatars** (and dropping **User** / **Script** / **Avatar**) is a separate, later step that requires schema and code changes.
