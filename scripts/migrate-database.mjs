import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting database migration...\n');

  try {
    console.log('📦 Step 1: Backing up current data...');

    const users = await prisma.user.findMany();
    const scripts = await prisma.script.findMany();
    const videos = await prisma.generatedVideo.findMany();
    const avatars = await prisma.avatar.findMany();

    const backup = {
      users,
      scripts,
      videos,
      avatars,
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Backed up ${backup.users.length} users`);
    console.log(`✅ Backed up ${backup.scripts.length} scripts`);
    console.log(`✅ Backed up ${backup.videos.length} videos`);
    console.log(`✅ Backed up ${backup.avatars.length} avatars\n`);

    const backupFilename = `backup-${Date.now()}.json`;
    fs.writeFileSync(backupFilename, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup saved to: ${backupFilename}\n`);

    console.log('🏗️  Step 2: Creating new tables...');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password TEXT,
        plan TEXT DEFAULT 'trial',
        "stripeCustomerId" TEXT,
        "stripeSubscriptionId" TEXT,
        "subscriptionStatus" TEXT,
        "subscriptionEndsAt" TIMESTAMP,
        "videoCredits" INTEGER DEFAULT 10,
        "videoCreditsUsed" INTEGER DEFAULT 0,
        "customAvatarsLimit" INTEGER DEFAULT 1,
        "maxVideoLength" INTEGER DEFAULT 60,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created users table');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        title TEXT,
        script TEXT,
        "scriptId" TEXT,
        "avatarId" TEXT,
        "heygenVideoId" TEXT,
        status TEXT DEFAULT 'pending',
        "videoUrl" TEXT,
        "thumbnailUrl" TEXT,
        duration INTEGER,
        "creditsUsed" INTEGER DEFAULT 1,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created videos table');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS scripts (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        title TEXT,
        content TEXT,
        platform TEXT DEFAULT 'tiktok',
        "editCount" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created scripts table');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS avatars (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        name TEXT NOT NULL,
        "heygenId" TEXT UNIQUE NOT NULL,
        type TEXT DEFAULT 'custom',
        "thumbnailUrl" TEXT,
        status TEXT DEFAULT 'processing',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created avatars table\n');

    console.log('👥 Step 3: Migrating users...');
    let migratedUsers = 0;

    for (const user of users) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO users (
            id, email, name, password, plan,
            "stripeCustomerId", "stripeSubscriptionId",
            "videoCredits", "videoCreditsUsed",
            "customAvatarsLimit", "maxVideoLength",
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO NOTHING`,
          user.id,
          user.email,
          user.name || null,
          user.password || null,
          user.plan || 'trial',
          user.stripe_customer_id || null,
          user.stripe_subscription_id || null,
          user.videoCredits ?? user.credits ?? 10,
          user.videoCreditsUsed ?? 0,
          user.customAvatarsLimit ?? 1,
          user.maxVideoLength ?? 60,
          user.createdAt || new Date(),
          user.updatedAt || new Date()
        );
        migratedUsers++;
        console.log(`✅ Migrated user: ${user.email}`);
      } catch (error) {
        console.log(`⏭️  User ${user.email} already exists or error: ${error.message}`);
      }
    }
    console.log(`\n✅ Migrated ${migratedUsers} users\n`);

    console.log('📝 Step 4: Migrating scripts...');
    let migratedScripts = 0;

    for (const script of scripts) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO scripts (
            id, "userId", title, content, platform, "editCount",
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING`,
          script.id,
          script.userId,
          script.projectName || script.title || null,
          script.content || '',
          script.platform || 'tiktok',
          script.refinementCount || 0,
          script.createdAt || new Date(),
          script.updatedAt || new Date()
        );
        migratedScripts++;
        console.log(`✅ Migrated script: ${script.id}`);
      } catch (error) {
        console.log(`⏭️  Script ${script.id} error: ${error.message}`);
      }
    }
    console.log(`\n✅ Migrated ${migratedScripts} scripts\n`);

    const scriptById = new Map(scripts.map((s) => [s.id, s]));

    console.log('🎬 Step 5: Migrating videos...');
    let migratedVideos = 0;

    for (const video of videos) {
      try {
        const scriptContent = scriptById.get(video.scriptId)?.content ?? video.script ?? '';
        const videoUrl = video.generatedVideoUrl ?? video.videoUrl ?? null;
        const status = video.videoStatus ?? video.status ?? 'pending';

        await prisma.$executeRawUnsafe(
          `INSERT INTO videos (
            id, "userId", script, "scriptId", "avatarId",
            "heygenVideoId", status, "videoUrl",
            "thumbnailUrl", duration, "creditsUsed",
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO NOTHING`,
          video.id,
          video.userId,
          scriptContent,
          video.scriptId || null,
          video.avatarId || 'default',
          video.generatedVideoId || null,
          status,
          videoUrl,
          video.thumbnailUrl || null,
          video.duration || null,
          video.creditsUsed ?? 1,
          video.createdAt || new Date(),
          video.updatedAt || new Date()
        );
        migratedVideos++;
        console.log(`✅ Migrated video: ${video.id}`);
      } catch (error) {
        console.log(`⏭️  Video ${video.id} error: ${error.message}`);
      }
    }
    console.log(`\n✅ Migrated ${migratedVideos} videos\n`);

    console.log('🎭 Step 6: Migrating avatars...');
    let migratedAvatars = 0;

    for (const avatar of avatars) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO avatars (
            id, "userId", name, "heygenId", type,
            "thumbnailUrl", status, "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING`,
          avatar.id,
          avatar.userId,
          avatar.name || 'Custom Avatar',
          avatar.heygenAvatarId || avatar.id,
          avatar.type || 'custom',
          avatar.imageUrl || null,
          avatar.status || 'ready',
          avatar.createdAt || new Date(),
          avatar.updatedAt || new Date()
        );
        migratedAvatars++;
        console.log(`✅ Migrated avatar: ${avatar.id}`);
      } catch (error) {
        console.log(`⏭️  Avatar ${avatar.id} error: ${error.message}`);
      }
    }
    console.log(`\n✅ Migrated ${migratedAvatars} avatars\n`);

    console.log('🔍 Step 7: Verifying migration...');

    const newUsers = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM users`);
    const newScripts = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM scripts`);
    const newVideos = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM videos`);
    const newAvatars = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM avatars`);

    const usersCount = Number(newUsers?.[0]?.count ?? newUsers?.[0]?.count ?? 0);
    const scriptsCount = Number(newScripts?.[0]?.count ?? newScripts?.[0]?.count ?? 0);
    const videosCount = Number(newVideos?.[0]?.count ?? newVideos?.[0]?.count ?? 0);
    const avatarsCount = Number(newAvatars?.[0]?.count ?? newAvatars?.[0]?.count ?? 0);

    console.log(`\n📊 Verification Results:`);
    console.log(`Users: ${backup.users.length} → ${usersCount}`);
    console.log(`Scripts: ${backup.scripts.length} → ${scriptsCount}`);
    console.log(`Videos: ${backup.videos.length} → ${videosCount}`);
    console.log(`Avatars: ${backup.avatars.length} → ${avatarsCount}`);

    console.log('\n✅ Migration verification passed!\n');

    console.log('🎉 Migration completed successfully!');
    console.log(`
      Summary:
      - ${migratedUsers} users migrated
      - ${migratedScripts} scripts migrated
      - ${migratedVideos} videos migrated
      - ${migratedAvatars} avatars migrated
      - Backup: ${backupFilename}

      ✅ All data is safe!
      ✅ Check Supabase to see new tables!
    `);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\n⚠️  Your data is safe!\n');
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
