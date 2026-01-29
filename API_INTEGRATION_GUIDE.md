# API Integration Guide

This guide shows you exactly where and how to integrate all APIs in your Content Creator SaaS platform.

## 📍 Where to Add API Keys

### Step 1: Create `.env` file

Copy the example file:
```bash
cp .env.example .env
```

### Step 2: Add Your API Keys

Edit the `.env` file in the root directory and add your API keys:

```env
# Required APIs
OPENAI_API_KEY=sk-your-actual-key-here
NEXTAUTH_SECRET=your-generated-secret-here

# Optional APIs (for full functionality)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
HEYGEN_API_KEY=your-heygen-key-here
```

---

## 🔑 API Integration Locations

### 1. OpenAI API (Required for Script Generation)

**Location**: `app/api/scripts/generate/route.ts`

**Current Integration**:
```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  // ← Reads from .env
});
```

**How to Get API Key**:
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Add to `.env` file

**Usage**: Already integrated! Just add your API key to `.env`

---

### 2. Google OAuth API (Optional - for Google Sign-In)

**Location**: `lib/auth.ts`

**Current Integration**:
```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
}),
```

**How to Get Credentials**:
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret
8. Add to `.env` file

**Note**: For production, add your production URL to authorized redirect URIs

---

### 3. HeyGen API (Phase 2 - Video Generation)

**Location**: `app/api/scripts/[id]/generate-video/route.ts`

**Current Status**: Placeholder with implementation guide

**How to Integrate**:

1. **Install HeyGen SDK**:
```bash
npm install @heygen/api
```

2. **Get API Key**:
   - Go to https://www.heygen.com
   - Sign up for an account
   - Get your API key from dashboard

3. **Update the Route** (`app/api/scripts/[id]/generate-video/route.ts`):

```typescript
import { HeyGen } from '@heygen/api';

const heygen = new HeyGen({ 
  apiKey: process.env.HEYGEN_API_KEY 
});

// Inside the POST function:
// 1. Create avatar from training video
const avatar = await heygen.avatars.create({
  video_url: script.video.url,
  name: `avatar-${session.user.id}`
});

// 2. Generate video with script
const video = await heygen.videos.create({
  avatar_id: avatar.id,
  script: script.content,
  voice: 'default' // or use voice clone
});

// 3. Update script with video URL
await prisma.script.update({
  where: { id: params.id },
  data: {
    status: 'video_ready',
    videoUrl: video.video_url
  }
});
```

---

### 4. Email Provider (Optional - for Email Authentication)

**Location**: `lib/auth.ts`

**Current Integration**:
```typescript
EmailProvider({
  server: {
    host: process.env.EMAIL_SERVER_HOST,
    port: process.env.EMAIL_SERVER_PORT,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  },
  from: process.env.EMAIL_FROM,
}),
```

**Popular Email Providers**:

**Gmail**:
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**SendGrid**:
```env
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

**Note**: For Gmail, you need to create an "App Password" in your Google Account settings.

---

## 🚀 Quick Setup Checklist

### Minimum Setup (Script Generation Only)
- [ ] Create `.env` file from `.env.example`
- [ ] Add `OPENAI_API_KEY` to `.env`
- [ ] Add `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- [ ] Add `DATABASE_URL` (default: `file:./dev.db` for SQLite)
- [ ] Run `npm install`
- [ ] Run `npx prisma generate && npx prisma migrate dev`

### Full Setup (All Features)
- [ ] Everything in Minimum Setup
- [ ] Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Google sign-in
- [ ] Add `HEYGEN_API_KEY` for video generation (Phase 2)
- [ ] Configure email provider (optional)

---

## 📝 Environment Variables Reference

| Variable | Required | Purpose | Where Used |
|----------|----------|---------|------------|
| `OPENAI_API_KEY` | ✅ Yes | Script generation | `app/api/scripts/generate/route.ts` |
| `NEXTAUTH_SECRET` | ✅ Yes | Session encryption | `lib/auth.ts` |
| `DATABASE_URL` | ✅ Yes | Database connection | `lib/prisma.ts` |
| `GOOGLE_CLIENT_ID` | ⚠️ Optional | Google OAuth | `lib/auth.ts` |
| `GOOGLE_CLIENT_SECRET` | ⚠️ Optional | Google OAuth | `lib/auth.ts` |
| `HEYGEN_API_KEY` | ⚠️ Optional | Video generation | `app/api/scripts/[id]/generate-video/route.ts` |
| `EMAIL_SERVER_*` | ⚠️ Optional | Email auth | `lib/auth.ts` |

---

## 🔍 How to Verify API Integration

### Test OpenAI Integration:
1. Start the app: `npm run dev`
2. Sign in to dashboard
3. Upload a training video
4. Create a new script
5. If script generates successfully → OpenAI is working ✅

### Test Google OAuth:
1. Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are in `.env`
2. Go to `/auth/signin`
3. Click "Continue with Google"
4. If Google sign-in works → OAuth is working ✅

### Test HeyGen (Phase 2):
1. Complete HeyGen integration in `generate-video/route.ts`
2. Add `HEYGEN_API_KEY` to `.env`
3. Generate a script
4. Call the video generation endpoint
5. If video generates → HeyGen is working ✅

---

## 🐛 Troubleshooting

### OpenAI API Errors:
- **Error**: "Invalid API key"
  - **Solution**: Check that your key starts with `sk-` and is correct
- **Error**: "Insufficient quota"
  - **Solution**: Add billing to your OpenAI account

### Google OAuth Errors:
- **Error**: "redirect_uri_mismatch"
  - **Solution**: Add `http://localhost:3000/api/auth/callback/google` to authorized URIs
- **Error**: "invalid_client"
  - **Solution**: Check Client ID and Secret are correct

### HeyGen API Errors:
- **Error**: "API key not found"
  - **Solution**: Verify `HEYGEN_API_KEY` is in `.env` and correct
- **Error**: "Avatar creation failed"
  - **Solution**: Check video URL is accessible and format is supported

---

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [HeyGen API Documentation](https://docs.heygen.com/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)

---

## 💡 Pro Tips

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use different keys for dev/prod** - Create separate `.env` files
3. **Rotate keys regularly** - Especially for production
4. **Monitor API usage** - Set up billing alerts
5. **Test in development first** - Before deploying to production

---

**Need Help?** Check the main `README.md` or `SETUP.md` for more details.
