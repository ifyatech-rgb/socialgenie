# Syncing Supabase with Your SaaS

Your app **already syncs** Prisma data to Supabase when the right env vars are set. This doc explains what runs and how to turn it on.

---

## 1. Set environment variables

In `.env` (or your host’s env), set:

```env
# Required for sync (and tracking)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

- **NEXT_PUBLIC_SUPABASE_URL** – Supabase project URL (Dashboard → Settings → API).
- **SUPABASE_SERVICE_ROLE_KEY** – Service role key from the same page (keep secret; server-only).

If either is missing, sync and Supabase tracking are skipped (no errors; app keeps using Prisma).

---

## 2. What syncs automatically

| Event | What gets synced to Supabase |
|--------|------------------------------|
| **Sign up / Sign in** (Credentials, Google) | User: `users` table (id, email, name, avatar_url; new rows get defaults like plan `trial`, `video_credits` 10). |
| **Update profile** (`PUT /api/user`) | User: plan, video_credits, genie_edits, custom_avatars_used, custom_avatars_limit, name, avatar_url. |
| **Create script** (`POST /api/scripts/generate`) | Script → `scripts`; activity → `activity_logs`. |
| **Generate video** (HeyGen) | Generated video → `generated_videos`; script status → `scripts`. |
| **Script → generate video** (`/api/scripts/[id]/generate-video`) | Script status/fields → `scripts`. |
| **Create custom avatar** (HeyGen) | Avatar → `avatars`; user usage → `users`. |
| **Upload video** | Video → `videos`. |

Sync is one-way: **Prisma is source of truth**; Supabase is updated for analytics, reporting, or future realtime.

---

## 3. Creator / special users in Supabase

- **Seeded in SQL** (e.g. `pkdigitalldreamers@gmail.com` in `full_schema_and_seed.sql`) stay in Supabase with the plan/credits you set there.
- When that user **signs in via your app**, the auth callback runs `syncUserToSupabase` with id, email, name, avatar. It **updates** the existing row by email and does **not** overwrite plan/credits if you don’t send them (so the seeded creator plan stays).
- If you **change plan/credits in Prisma** (e.g. upgrade in app or via script), that is pushed to Supabase only when:
  - The user hits **Update profile** (`PUT /api/user`), or
  - You run a one-time sync (see below).

So: for creator users you can either keep them in sync by using the app’s profile/plan flow, or re-run the seed SQL for that email to reset Supabase to the desired plan/credits.

---

## 4. One-time sync of existing users (optional)

If you had users in Prisma before Supabase was set up, you can backfill Supabase once:

1. **Option A – From your app:** Ensure env vars are set, then trigger a “refresh” that calls your user API (e.g. each user opens profile or you run a script that calls `PUT /api/user` with current data). Your `PUT /api/user` handler already calls `syncUserToSupabase` with plan and credits.

2. **Option B – From Supabase:** Run SQL that inserts/updates `users` in Supabase from your Prisma DB (e.g. export from Prisma and `INSERT ... ON CONFLICT (email) DO UPDATE` in Supabase). Use this when you don’t want to go through the app.

3. **Option C – Script:** Add a small Node script that loads users from Prisma and, for each, calls `syncUserToSupabase({ id, email, name, avatar_url, plan, video_credits, genie_edits, custom_avatars_used, custom_avatars_limit })` (reusing the same helper your app uses). Run it once with the same env vars.

---

## 5. Checking that sync is on

- After sign up or profile update, check Supabase **Table Editor → `users`**: you should see the row (or updated plan/credits).
- In the terminal where `npm run dev` runs, look for logs like: `✅ User synced to Supabase (created): ...` or `(updated): ...` (these come from `lib/supabase-sync.ts`).

If those env vars are not set, sync is skipped and you won’t see errors—only missing or stale data in Supabase.

---

## Summary

1. Set **NEXT_PUBLIC_SUPABASE_URL** and **SUPABASE_SERVICE_ROLE_KEY** in `.env`.
2. Restart the app so it picks up env.
3. Use the app as usual: sign up, update profile, create scripts/videos; Supabase stays in sync automatically.
4. For creator/special users, either rely on the seeded row in Supabase or re-run the seed SQL / profile update so Supabase matches Prisma.
