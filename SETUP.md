# Setup Guide

## Quick Start

1. **Clone and install**:
```bash
npm install
```

2. **Set up environment**:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Initialize database**:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. **Run development server**:
```bash
npm run dev
```

## Environment Variables

### Required

- `DATABASE_URL` - SQLite for dev: `file:./dev.db`
- `NEXTAUTH_URL` - Your app URL: `http://localhost:3000`
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys

### Optional

- `GOOGLE_CLIENT_ID` - For Google OAuth (get from Google Cloud Console)
- `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `HEYGEN_API_KEY` - For Phase 2 video generation (get from HeyGen)

## Authentication Setup

### Google OAuth (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env`

### Email Authentication (Alternative)

Configure email provider in `.env`:
- `EMAIL_SERVER_HOST` - SMTP host
- `EMAIL_SERVER_PORT` - SMTP port
- `EMAIL_SERVER_USER` - SMTP username
- `EMAIL_SERVER_PASSWORD` - SMTP password
- `EMAIL_FROM` - From email address

## Database

### Development (SQLite)

SQLite is used by default. The database file will be created at `prisma/dev.db`.

### Production (PostgreSQL)

1. Create a PostgreSQL database
2. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
   ```
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

## File Uploads

Videos are stored in `public/uploads/videos/` by default. For production:

1. Use cloud storage (S3, R2, etc.)
2. Update `app/api/videos/upload/route.ts` to upload to cloud storage
3. Update video URLs in database

## Testing the Application

1. **Sign up/Sign in**: Use Google OAuth or email
2. **Upload training video**: Go to Dashboard → Upload Video
3. **Generate script**: Go to Dashboard → Generate Script
4. **View scripts**: All scripts are listed in Dashboard → Scripts

## Troubleshooting

### Database errors
- Make sure Prisma client is generated: `npx prisma generate`
- Check `DATABASE_URL` is correct
- Try resetting database: `npx prisma migrate reset`

### Authentication errors
- Check `NEXTAUTH_SECRET` is set
- Verify OAuth credentials are correct
- Check redirect URIs match

### OpenAI API errors
- Verify `OPENAI_API_KEY` is correct
- Check API quota/billing
- Ensure you have access to GPT-4

### File upload errors
- Check `public/uploads/videos/` directory exists
- Verify file size limits (100MB max)
- Check file permissions

## Next Steps

1. Customize branding and colors
2. Add payment integration (Stripe)
3. Implement Phase 2 video generation
4. Add analytics
5. Set up monitoring and error tracking
