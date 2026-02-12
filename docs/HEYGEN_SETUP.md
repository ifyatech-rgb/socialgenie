# HeyGen Avatar Video Integration

HeyGen avatar video generation is fully integrated. Follow these steps to use it.

## 1. Add your HeyGen API key

Create or edit `.env.local` in the project root and add:

```
HEYGEN_API_KEY=your_heygen_api_key_here
```

Get your API key from [HeyGen Developer Console](https://app.heygen.com/settings/api).

> **Security:** Never commit your API key. `.env.local` is gitignored.

## 2. Flow

1. **Generate Script** → Go to [Dashboard → Scripts](/dashboard/scripts), create a script
2. **Make Video** → Click "Generate Video" on your script
3. **Avatars Page** → You're taken to [Dashboard → Avatars](/dashboard/avatars)
4. **Select Avatar** → Pick an avatar from the grid (free avatars only by default)
5. **Select Voice** → Choose a voice for your avatar (with preview)
6. **Generate** → Click "Generate Video (5 Credits)"
7. **Wait** → Video takes 2–5 minutes. Status updates automatically.
8. **Download** → When ready, preview and download

## 3. Credits

- Script (no research): 1 credit
- Script (with research): 3 credits
- **Video generation: 5 credits**

## 4. Features

- Browse avatars from HeyGen (free/public only by default)
- Avatar-specific voice selection
- Voice preview before selecting
- 9:16 (TikTok/Instagram) or 16:9 (YouTube) based on platform
- Real-time status polling
- Video preview and download
- Projects page shows all generated videos with progress

## 5. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/heygen/avatars` | GET | List avatars (use `?all=true` for paid) |
| `/api/heygen/avatar-voices?avatarId=X` | GET | Voices for avatar |
| `/api/heygen/generate` | POST | Generate video |
| `/api/heygen/status?videoId=X` | GET | Check video status |

## 6. Troubleshooting

- **No avatars loading?** Ensure `HEYGEN_API_KEY` is set in `.env.local` and restart the dev server.
- **Need more avatars?** Use `/api/heygen/avatars?all=true` or add IDs to `config/heygen-free-avatars.ts`.
