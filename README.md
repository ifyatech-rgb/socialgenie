# Content Creator SaaS Platform

A SaaS platform where content creators upload ONE video of themselves talking, then the AI generates unlimited social media content (scripts and videos) in their voice and style.

## Features

### Phase 1 (MVP)
- ✅ User authentication
- ✅ Video upload (2-minute training video)
- ✅ AI script generation based on topic, platform, tone, and length
- ✅ Script management dashboard

### Phase 2 (Coming Soon)
- 🔄 AI video generation using HeyGen API
- 🔄 Automatic video download

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma + SQLite (can be upgraded to PostgreSQL)
- **Authentication**: NextAuth.js
- **AI**: OpenAI API (for script generation)
- **Video**: HeyGen API (Phase 2)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key (for script generation)
- Google OAuth credentials (optional, for authentication)
- HeyGen API key (optional, for Phase 2 video generation)

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
# Database (SQLite for development, PostgreSQL for production)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# OpenAI API (Required for script generation)
OPENAI_API_KEY=sk-your-openai-api-key-here

# HeyGen API (Optional, for Phase 2)
HEYGEN_API_KEY=your-heygen-api-key-here

# Google OAuth (Optional, for Google sign-in)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

3. **Set up the database**:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. **Run the development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Generating NEXTAUTH_SECRET

You can generate a secure secret with:
```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (auth)/            # Auth pages
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx           # Landing page
├── components/            # React components
├── lib/                   # Utilities and configurations
├── prisma/                # Prisma schema
└── public/                # Static assets
```

## Pricing Plans

- **Basic Plan**: $49-79/month - Script generation only
- **Pro Plan**: $149-199/month - Script + Video generation

## Roadmap

- ✅ Week 1-2: Build script generator MVP
- 🔄 Week 3-4: Launch, get 5-10 customers
- 📅 Month 2: Add video generation (HeyGen API integration)
- 📅 Month 3: Add trending topics detector
- 📅 Month 4: Add team features, white-label option

## Phase 2: Video Generation

Video generation with HeyGen API is planned for Phase 2. The API endpoint is already set up at `/api/scripts/[id]/generate-video` with detailed implementation comments. To enable:

1. Get a HeyGen API key from https://www.heygen.com
2. Add `HEYGEN_API_KEY` to your `.env` file
3. Implement the HeyGen integration following the comments in `app/api/scripts/[id]/generate-video/route.ts`
4. Update the script status and video URL when generation completes

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Database

For production, use PostgreSQL instead of SQLite:
1. Update `DATABASE_URL` in `.env` to your PostgreSQL connection string
2. Run migrations: `npx prisma migrate deploy`

### File Storage

For production, consider using:
- AWS S3
- Cloudflare R2
- Vercel Blob Storage

Update the upload endpoint to use your chosen storage solution.
