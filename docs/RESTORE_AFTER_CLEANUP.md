# Restore app after cleanup ("Database connection failed")

If you ran `cleanup-old-tables` and now see **"Database connection failed. Please try again later."** on login, the app is missing the old tables it still uses. Do this to restore:

---

## Step 1: Recreate old tables from Prisma schema

From the project root:

```bash
npx prisma db push
```

This recreates the tables your app expects: **User**, **Account**, **Session**, **Script**, **GeneratedVideo**, **Avatar**, **Video**, **Subscription**, **Onboarding**, **TrainingVideo**, **Activity**, etc. They will be **empty**.

---

## Step 2: Copy user data back into `User`

So login works again (user rows exist):

```bash
node scripts/restore-old-tables.mjs
# or
npm run restore-after-cleanup
```

This copies rows from the **users** table into **User**. **Account** and **Session** stay empty; they are recreated when users log in again.

---

## Step 3: Restart the app

```bash
npm run dev
```

Then try logging in. Users may need to sign in again (password or Google) so new sessions are created.

---

## If you have a full DB backup

If you have a `pg_dump` from before the cleanup:

```bash
psql "$DATABASE_URL" < backup-before-migration.sql
```

That restores the whole database. You can skip steps 1 and 2.
