# Deployment checklist (Vercel / Railway / etc.)

## Build status

- **Local build:** `npm run build` passes (TypeScript, lint, static generation).
- **Deploy:** The app will **build successfully** on Vercel/Railway if you set the right env vars and database.

---

## Must fix for production

### 1. Database (PostgreSQL)

The app is configured for **PostgreSQL** (e.g. Supabase). Set `DATABASE_URL` to your Postgres connection string.

**First-time setup:**

1. In `.env`, set `DATABASE_URL` to your Supabase/Postgres URI (replace `[YOUR-PASSWORD]` with your DB password).
2. Run `npx prisma generate` to regenerate the Prisma client.
3. Run `npx prisma migrate dev --name init` to create and apply migrations (or `npx prisma db push` for a quick schema sync without migration history).
4. In production (Vercel/Railway), set `DATABASE_URL` in the platform’s environment variables to the same Postgres URL.

### 2. Environment variables (required on the platform)

Set these in your hosting dashboard (Vercel → Project → Settings → Environment Variables, or Railway → Variables):

| Variable | Example / note |
|----------|-----------------|
| `DATABASE_URL` | Postgres URL in production (see above). |
| `NEXTAUTH_URL` | Your live URL, e.g. `https://your-app.vercel.app` or `https://yourdomain.com`. |
| `NEXTAUTH_SECRET` | Long random string (e.g. `openssl rand -base64 32`). |
| `ANTHROPIC_API_KEY` | If you use script generation. |
| `DID_API_KEY` | If you use D-ID video generation. |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | If you use Supabase (e.g. admin check / profiles). |

Optional: `NEXT_PUBLIC_APP_URL` for correct Open Graph / share links (e.g. `https://yourdomain.com`). If unset, Vercel’s `VERCEL_URL` is used for `metadataBase`.

---

## Already handled

- **TypeScript:** No type errors; admin check uses a type assertion so the build passes.
- **metadataBase:** Set from `NEXT_PUBLIC_APP_URL` or `VERCEL_URL` so OG/Twitter images use your live URL, not localhost.
- **Dynamic routes:** API routes that use `getServerSession` (and thus `headers`) are correctly treated as dynamic; the “Dynamic server usage” messages during build are expected and do not fail the build.

---

## Optional improvements

- **File uploads:** `UPLOAD_DIR=./uploads` writes to the server filesystem. On serverless this is not persistent. For production, consider Supabase Storage or S3 and update the avatar/upload APIs to use that.
- **Stripe:** Add Stripe keys when you enable payments.

---

## Quick summary

| Item | Status |
|------|--------|
| Build passes | Yes |
| TypeScript / lint | OK |
| Production DB | **You must switch to Postgres (or persistent DB) and set `DATABASE_URL`** |
| NEXTAUTH_URL / NEXTAUTH_SECRET | **Set in platform env** |
| API keys (Anthropic, D-ID, etc.) | Set in platform env |
| metadataBase / OG | Fixed (uses env or VERCEL_URL) |

Once `DATABASE_URL` (Postgres) and `NEXTAUTH_*` are set on the platform, the app is ready to deploy and run live.
