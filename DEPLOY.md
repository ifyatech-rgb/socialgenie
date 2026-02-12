# Deploy SocialGenie Live (Vercel)

Your app runs on **localhost** right now. To go **live** on the internet:

---

## Before you deploy

- **Database:** Use **PostgreSQL** (e.g. Supabase). For Vercel (serverless), use the **connection pooler** URL with port **6543** and `?pgbouncer=true` so Prisma works (e.g. `postgresql://...@...supabase.co:6543/postgres?pgbouncer=true`). Run migrations locally first: `npx prisma migrate deploy` (or `prisma db push`).
- **File uploads:** On Vercel the filesystem is read-only. The app will return a clear error if users try to upload videos to the server. For production video uploads, you’ll need to use **Supabase Storage** or **S3** and update the upload API; until then, other features (scripts, HeyGen/D-ID video generation, auth, Stripe) work as normal.

---

## 1. Push your code to GitHub

1. Create a new repo on [github.com](https://github.com/new).
2. In your project folder, run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use GitHub).
2. Click **Add New** → **Project**.
3. Import your GitHub repo.
4. **Environment Variables** — add every variable from your `.env`:

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | Your Supabase connection string (use **pooler** port **6543** for serverless) |
   | `NEXTAUTH_URL` | **https://your-app.vercel.app** (replace with your real Vercel URL) |
   | `NEXTAUTH_SECRET` | A long random string (e.g. `openssl rand -base64 32`) |
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
   | `ANTHROPIC_API_KEY` | Your Claude API key |
   | `DID_API_KEY` | Your D-ID API key |
   | `STRIPE_SECRET_KEY` | Stripe secret key |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
   | `STRIPE_PRICE_ID` | Stripe **Price** ID (e.g. `price_xxx`) |
   | `STRIPE_WEBHOOK_SECRET` | From Stripe webhook (see step 4) |
   | `NEXT_PUBLIC_APP_URL` | **https://your-app.vercel.app** (same as NEXTAUTH_URL) |

5. Click **Deploy**. Vercel will run `prisma generate` and `next build`.

---

## 3. Set NEXTAUTH_URL after first deploy

1. After the first deploy, Vercel gives you a URL like `https://your-app-xxx.vercel.app`.
2. Go to **Project → Settings → Environment Variables**.
3. Set **NEXTAUTH_URL** and **NEXT_PUBLIC_APP_URL** to that URL (e.g. `https://your-app-xxx.vercel.app`).
4. Redeploy: **Deployments** → three dots on latest → **Redeploy**.

---

## 4. Stripe webhook (for live payments)

1. In [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → **Developers** → **Webhooks** → **Add endpoint**.
2. **Endpoint URL:** `https://your-app.vercel.app/api/webhooks/stripe`
3. **Events to send:**  
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`
4. Copy the **Signing secret** (starts with `whsec_`).
5. In Vercel, add **STRIPE_WEBHOOK_SECRET** = that signing secret.
6. Redeploy so the new env is used.

---

## 5. NextAuth allowed URLs (if you use Google/OAuth)

1. In [Google Cloud Console](https://console.cloud.google.com/) (or your OAuth provider), add your live URL to **Authorized redirect URIs**, e.g.  
   `https://your-app.vercel.app/api/auth/callback/google`
2. In NextAuth provider settings, set the **redirect URI** to that URL.

---

## 6. Supabase (optional for production)

- Use the **connection pooler** URL for `DATABASE_URL` (port **6543**) so serverless works.
- In Supabase **Authentication → URL Configuration**, set **Site URL** to `https://your-app.vercel.app` and add that URL to **Redirect URLs** if you use Supabase Auth.

---

## 7. Optional environment variables

| Variable | Purpose |
|----------|---------|
| `MAX_FILE_SIZE` | Max upload size in bytes (default 104857600 = 100MB). Only applies when using server-side uploads (e.g. not on Vercel). |
| `UPLOAD_DIR` | Local upload directory (default `./uploads`). Not used on Vercel. |

---

## Summary

| Step | What to do |
|------|------------|
| 1 | Push code to GitHub |
| 2 | Import repo in Vercel, add all env vars |
| 3 | Set **NEXTAUTH_URL** and **NEXT_PUBLIC_APP_URL** to your Vercel URL |
| 4 | Add Stripe webhook with your live URL, set **STRIPE_WEBHOOK_SECRET** |
| 5 | Update OAuth redirect URIs to your live URL |
| 6 | (Optional) Update Supabase Site URL / redirect URLs |
| 7 | (Optional) Add MAX_FILE_SIZE / UPLOAD_DIR if using non-Vercel hosting with file uploads |

After that, your app is **live** at `https://your-app.vercel.app` (or your custom domain if you add one in Vercel).
