# Projects / Video Progress Tracking

This app uses the **Script** model for video projects. Scripts with `generatedVideoId` are "video projects"
and appear on the Projects page.

## Schema (already in place)

The Script model includes:
- `generatedVideoId` - HeyGen video ID
- `videoStatus` - pending, processing, completed, failed
- `videoProgress` - 0-100
- `generatedVideoUrl`, `thumbnailUrl`, `duration`, `videoError`

No additional migrations are required.

## Optional: Supabase Realtime

If you use Supabase and want real-time updates when Script rows change, enable realtime for the `Script` table:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE "Script";
```

(The table name depends on your Prisma mapping - check your actual table name in the database.)
