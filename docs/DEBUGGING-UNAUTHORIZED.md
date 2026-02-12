# Debugging "Unauthorized" on Generate Video (SocialGenie)

Use this guide when the **Generate Video** button returns "Unauthorized" even though you're logged in and have credits.

---

## 1. Browser Developer Console

### Open the console
- **Chrome / Edge:** `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
- **Firefox:** `F12` or `Ctrl+Shift+K` / `Cmd+Option+K`

### What to look for
- **Red errors** – JS errors or failed fetches
- **Failed network requests** – often show as red in the Console when a `fetch` fails
- Filter by typing `videos/generate` or `401` in the Console filter box

### Useful filter
- In Console, use the filter (funnel) and choose **Errors** or type:  
  `fetch` or `api` or `401`

---

## 2. Network Tab (Most important)

### Open Network tab
- Same DevTools window → **Network** tab (next to Console).
- Leave it open, then click **Generate Video** again.

### Find the failing request
1. In the list, find a request whose **Name** is **`generate`** (under `videos`) or **`videos/generate`**.
2. **Method** should be **POST**.
3. **Status** will be **401** (Unauthorized) when this bug happens.

### Inspect the request
1. Click the **`generate`** (or **videos/generate**) request.
2. **Headers** sub-tab:
   - **Request URL:** should be your app origin + `/api/videos/generate` (e.g. `http://localhost:3000/api/videos/generate`).
   - **Request Headers:** check:
     - **Cookie** – should contain `next-auth.session-token=...` (or `__Secure-next-auth.session-token` on HTTPS).  
       If **Cookie** is missing or has no `next-auth.session-token`, the browser isn’t sending the session (e.g. wrong domain/URL).
3. **Payload** (or **Request**): body should include `scriptId`, `avatarId`, etc. (confirms the button sent the right data).

### Inspect the response
1. **Response** sub-tab (or **Preview**):
   - You should see JSON, e.g. `{ "error": "Unauthorized", "code": "session_invalid" }` or `{ "error": "...", "code": "no_session_cookie" }`.
2. **Status code:**
   - **401** – Not authenticated (no/invalid session).
   - **403** – Forbidden (e.g. not allowed to use this script).
   - **402** – Payment/credits (e.g. not enough credits).

### What the `code` means
- **`no_session_cookie`** – No session cookie was sent. Use the **exact same URL** you used to sign in (e.g. always `http://localhost:3000`, not `http://127.0.0.1:3000`), then try again. If needed, sign out and sign in again.
- **`session_invalid`** – Cookie was sent but the session couldn’t be validated (e.g. expired, wrong secret). Try signing out and signing in again; ensure `NEXTAUTH_SECRET` hasn’t changed.

### If the status is **500 Internal Server Error**
- The server threw an exception. Click the request → **Response** (or **Preview**) tab to see the JSON body.
- You should see `{ "error": "...", "code": "server_error" }`. The **`error`** field is the real message (e.g. D-ID API error, database error, invalid JSON).
- Check the **terminal** where you run `npm run dev` for a line like `[VideoGen] Error:` — the next line(s) show the full stack trace.
- Common causes: missing or invalid **D-ID API key** (`.env` `DID_API_KEY`), database/Prisma error (e.g. missing `Activity` table), or invalid request body.

---

## 3. Troubleshooting steps

### A. Same URL as sign-in
- Open the app with the **same origin** you used to sign in (e.g. `http://localhost:3000`).
- Don’t mix `http://127.0.0.1:3000` and `http://localhost:3000` – cookies are per-origin.

### B. Cookies
- **Application** tab (Chrome) or **Storage** tab (Firefox) → **Cookies** → select your site.
- Check for **`next-auth.session-token`** (or `__Secure-next-auth.session-token`).
- If it’s missing on the correct origin, sign in again.

### C. localStorage / sessionStorage
- SocialGenie uses **cookies** for the session (NextAuth), not localStorage for the main auth token.
- You can still check **Application → Local Storage / Session Storage** for your site to see if anything looks wrong (e.g. old keys); clearing it is rarely required for this error.

### D. Sign out and sign in again
1. Go to **Settings** (or your profile) and **Sign out**.
2. Sign in again with the same URL (e.g. `http://localhost:3000`).
3. Go to **Generate Video** and click **Generate Video** again.

### E. Clear cookies for the site (if needed)
- **Application** → **Cookies** → right‑click your site → **Clear** (or remove only `next-auth.session-token`), then sign in again.

---

## 4. What to capture for support

### Screenshots
1. **Network** tab: list of requests with the **`generate`** (or `videos/generate`) request visible and **Status 401**.
2. **Request headers** for that request (you can redact the long cookie value and leave the header names).
3. **Response** (or Preview) for that request showing the JSON body (e.g. `error` and `code`).

### Copy-paste
1. **Response body** of the 401 request (e.g. `{ "error": "Unauthorized", "code": "session_invalid" }`).
2. **Request URL** (e.g. `http://localhost:3000/api/videos/generate`).
3. Whether **Cookie** header is present (yes/no) – no need to paste the full cookie.

### Environment
- Browser and version (e.g. Chrome 120).
- OS (e.g. Windows 11).
- Whether you’re on **localhost** or a deployed URL; if deployed, the exact URL you use to open the app and to sign in.

### Server logs (if you run the app yourself)
- In the terminal where you run `npm run dev` (or your start command), check for any `[VideoGen]` or auth-related errors right when you click **Generate Video**.

---

## Quick checklist

- [ ] Network tab shows **POST** to `/api/videos/generate` with **401**.
- [ ] Response has `error` and `code` (`no_session_cookie` or `session_invalid`).
- [ ] Request headers include **Cookie** with `next-auth.session-token` (or __Secure-…).
- [ ] Using the same URL for the app and for sign-in (e.g. always `http://localhost:3000`).
- [ ] Tried **Sign out** → **Sign in** → **Generate Video** again.
- [ ] Captured screenshot of Network request/response and (if applicable) server log line for support.
