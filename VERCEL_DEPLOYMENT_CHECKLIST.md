# Vercel deployment readiness checklist

Use this list to confirm the project is ready to deploy to Vercel.

## Build and config

| Item | Status |
|------|--------|
| **Next.js** | `next.config.js` present; no `output: 'standalone'` needed (Vercel uses its own runtime). |
| **Build script** | `npm run build` runs `prisma generate && next build`. |
| **vercel.json** | Present with `framework`, `buildCommand`, `installCommand`. Optional; Vercel detects Next.js by default. |
| **Prisma** | Schema uses PostgreSQL; `lib/prisma.ts` uses a global singleton (serverless-safe). Use **pooler** `DATABASE_URL` (port 6543, `?pgbouncer=true`) on Vercel. |
| **Metadata / OG** | `app/layout.tsx` sets `metadataBase` from `NEXT_PUBLIC_APP_URL` or `VERCEL_URL` so OG/Twitter links work in production. |

## Environment variables (set in Vercel → Project → Settings → Environment Variables)

**Required for core features:**

- `DATABASE_URL` – PostgreSQL (Supabase pooler: port **6543**, `?pgbouncer=true`).
- `NEXTAUTH_URL` – Your live URL (e.g. `https://your-app.vercel.app`). Set after first deploy.
- `NEXTAUTH_SECRET` – Long random string (e.g. `openssl rand -base64 32`).
- `ANTHROPIC_API_KEY` – For script generation.
- `DID_API_KEY` – For D-ID video generation (if used).
- `NEXT_PUBLIC_APP_URL` – Same as `NEXTAUTH_URL` (for callbacks and public links).

**Supabase (admin/profiles):**

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

**Stripe (payments):**

- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` (from Stripe webhook for your live URL).

See `.env.example` and `DEPLOY.md` for full list and Stripe webhook setup.

## Behaviour on Vercel

| Feature | Notes |
|---------|--------|
| **Auth** | NextAuth with Prisma adapter; works with pooler DB. |
| **API routes** | Use Node runtime by default; `getServerSession`, Prisma, Stripe, etc. are fine. |
| **Stripe webhook** | `POST /api/webhooks/stripe` – set endpoint in Stripe to `https://your-app.vercel.app/api/webhooks/stripe` and add `STRIPE_WEBHOOK_SECRET`. |
| **Video upload (server)** | **Disabled on Vercel.** The upload API returns 503 with a message so the app does not crash. For production file storage, use Supabase Storage or S3 and update the upload flow. |
| **HeyGen / D-ID** | External APIs; no filesystem dependency. |
| **Middleware** | NextAuth middleware; matcher for `/dashboard/:path*`; no edge-incompatible code. |

## Optional

- **OAuth (Google, etc.):** Add your Vercel URL to redirect URIs in the provider console.
- **Supabase Auth:** Set Site URL and Redirect URLs in Supabase to your Vercel URL.
- **Long-running APIs:** If any route needs >10s (Hobby) or >60s (Pro), configure `maxDuration` in `vercel.json` for that route or in the dashboard.

## Quick deploy steps

1. Push the repo to GitHub.
2. In Vercel: **Add New → Project** → import the repo.
3. Add all required environment variables (see above and `DEPLOY.md`).
4. Deploy. After first deploy, set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to the deployed URL and redeploy.
5. Configure Stripe webhook and OAuth redirect URIs as needed.

The project is **ready for Vercel** once `DATABASE_URL` (Postgres pooler), `NEXTAUTH_*`, and the API keys you use are set. Video upload to server is intentionally disabled on Vercel until you switch to Supabase Storage or S3.
