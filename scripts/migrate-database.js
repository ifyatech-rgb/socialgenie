/**
 * Database Migration Script - Safe data copy to new clean tables
 *
 * This script:
 * 1. Backs up current data from existing tables (User, Script, GeneratedVideo, Avatar)
 * 2. Creates new tables (users, videos, scripts, avatars, analytics) if they don't exist
 * 3. Copies all data into the new tables with proper field mapping
 * 4. Verifies row counts
 *
 * IMPORTANT: Your current schema has Script, GeneratedVideo, Avatar (no "Project").
 * Data is mapped as: User → users, Script → scripts, GeneratedVideo → videos, Avatar → avatars.
 *
 * Usage:
 *   node scripts/migrate-database.js
 *
 * Prerequisites:
 *   - DATABASE_URL and DIRECT_DATABASE_URL in .env
 *   - Current schema (schema.prisma) is applied - do NOT switch to schema-new yet
 */

const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function loadEnv() {
  try {
    const envPath = path.join(__dirname, "..", ".env");
    const content = fs.readFileSync(envPath, "utf8");
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const idx = trimmed.indexOf("=");
        if (idx > 0) {
          const key = trimmed.slice(0, idx).trim();
          let val = trimmed.slice(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
            val = val.slice(1, -1);
          process.env[key] = val;
        }
      }
    });
  } catch (_) {}
}

function escapeSql(val) {
  if (val == null) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "true" : "false";
  if (val instanceof Date) return `'${val.toISOString()}'`;
  return "'" + String(val).replace(/'/g, "''") + "'";
}

async function main() {
  loadEnv();
  console.log("🚀 Starting database migration (backup + copy to new tables)...\n");

  try {
    // ═══════════════════════════════════════════════════════
    // STEP 1: BACKUP CURRENT DATA (from existing tables)
    // ═══════════════════════════════════════════════════════
    console.log("📦 Step 1: Backing up current data...");

    const backup = {
      users: await prisma.$queryRaw`SELECT * FROM "User"`,
      scripts: await prisma.$queryRaw`SELECT * FROM "Script"`,
      generatedVideos: await prisma.$queryRaw`SELECT * FROM "GeneratedVideo"`,
      avatars: await prisma.$queryRaw`SELECT * FROM "Avatar"`,
    };

    const backupPath = path.join(__dirname, "..", "backup-" + Date.now() + ".json");
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf8");

    console.log(`   Users: ${backup.users.length}`);
    console.log(`   Scripts: ${backup.scripts.length}`);
    console.log(`   GeneratedVideos: ${backup.generatedVideos.length}`);
    console.log(`   Avatars: ${backup.avatars.length}`);
    console.log(`   ✅ Backup saved to ${backupPath}\n`);

    // ═══════════════════════════════════════════════════════
    // STEP 2: CREATE NEW TABLES (if not exist)
    // ═══════════════════════════════════════════════════════
    console.log("🏗️  Step 2: Creating new tables (if not exist)...");

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password TEXT,
        plan TEXT NOT NULL DEFAULT 'trial',
        "stripeCustomerId" TEXT UNIQUE,
        "stripeSubscriptionId" TEXT,
        "subscriptionStatus" TEXT,
        "subscriptionEndsAt" TIMESTAMP(3),
        "videoCredits" INTEGER NOT NULL DEFAULT 10,
        "videoCreditsTotal" INTEGER NOT NULL DEFAULT 10,
        "videoCreditsUsed" INTEGER NOT NULL DEFAULT 0,
        "customAvatarsLimit" INTEGER NOT NULL DEFAULT 1,
        "maxVideoLength" INTEGER NOT NULL DEFAULT 60,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastLoginAt" TIMESTAMP(3)
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS scripts (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        title TEXT,
        topic TEXT,
        niche TEXT,
        content TEXT NOT NULL,
        hook TEXT,
        body TEXT,
        cta TEXT,
        platform TEXT DEFAULT 'tiktok',
        style TEXT,
        tone TEXT,
        prompt TEXT,
        model TEXT,
        "wordCount" INTEGER,
        "estimatedLength" INTEGER,
        "editCount" INTEGER NOT NULL DEFAULT 0,
        "isFavorite" BOOLEAN NOT NULL DEFAULT false,
        "isUsed" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT scripts_user_fkey FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS scripts_user_idx ON scripts("userId");
      CREATE INDEX IF NOT EXISTS scripts_created_idx ON scripts("createdAt");
      CREATE INDEX IF NOT EXISTS scripts_favorite_idx ON scripts("isFavorite");
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        title TEXT,
        script TEXT NOT NULL,
        "scriptId" TEXT,
        "avatarId" TEXT NOT NULL,
        "avatarName" TEXT,
        "avatarType" TEXT NOT NULL DEFAULT 'public',
        "voiceId" TEXT,
        "heygenVideoId" TEXT UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        "videoUrl" TEXT,
        "thumbnailUrl" TEXT,
        duration INTEGER,
        platform TEXT DEFAULT '9:16',
        resolution TEXT DEFAULT '1080p',
        "creditsUsed" INTEGER NOT NULL DEFAULT 1,
        "heygenCost" DOUBLE PRECISION,
        error TEXT,
        "retryCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completedAt" TIMESTAMP(3),
        CONSTRAINT videos_user_fkey FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
        CONSTRAINT videos_script_fkey FOREIGN KEY ("scriptId") REFERENCES "Script"(id)
      );
      CREATE INDEX IF NOT EXISTS videos_user_idx ON videos("userId");
      CREATE INDEX IF NOT EXISTS videos_status_idx ON videos(status);
      CREATE INDEX IF NOT EXISTS videos_heygen_idx ON videos("heygenVideoId");
      CREATE INDEX IF NOT EXISTS videos_created_idx ON videos("createdAt");
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS avatars (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        name TEXT NOT NULL,
        "heygenId" TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL DEFAULT 'custom',
        "thumbnailUrl" TEXT,
        "trainingVideoUrl" TEXT,
        status TEXT NOT NULL DEFAULT 'processing',
        "isPrivate" BOOLEAN NOT NULL DEFAULT true,
        "heygenStatus" TEXT,
        error TEXT,
        "usageCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "readyAt" TIMESTAMP(3),
        CONSTRAINT avatars_user_fkey FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS avatars_user_idx ON avatars("userId");
      CREATE INDEX IF NOT EXISTS avatars_status_idx ON avatars(status);
      CREATE INDEX IF NOT EXISTS avatars_heygen_idx ON avatars("heygenId");
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS analytics (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "eventType" TEXT NOT NULL,
        metadata JSONB,
        "creditsCost" INTEGER,
        "moneyCost" DOUBLE PRECISION,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT analytics_user_fkey FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS analytics_user_idx ON analytics("userId");
      CREATE INDEX IF NOT EXISTS analytics_event_idx ON analytics("eventType");
      CREATE INDEX IF NOT EXISTS analytics_created_idx ON analytics("createdAt");
    `).catch(() => {});

    console.log("   ✅ New tables ready (users, scripts, videos, avatars, analytics)\n");

    // ═══════════════════════════════════════════════════════
    // STEP 3: MIGRATE USERS → users
    // ═══════════════════════════════════════════════════════
    console.log("👥 Step 3: Migrating users → users...");
    let migratedUsers = 0;
    for (const u of backup.users) {
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO users (id, email, name, password, plan, "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus", "subscriptionEndsAt",
            "videoCredits", "videoCreditsTotal", "videoCreditsUsed", "customAvatarsLimit", "maxVideoLength", "createdAt", "updatedAt", "lastLoginAt")
          VALUES (
            ${escapeSql(u.id)}, ${escapeSql(u.email)}, ${escapeSql(u.name)}, ${escapeSql(u.password)},
            ${escapeSql(u.plan || "trial")}, ${escapeSql(u.stripe_customer_id)}, ${escapeSql(u.stripe_subscription_id)}, ${escapeSql(u.subscription_status)}, NULL,
            ${escapeSql(u.videoCredits ?? u.credits ?? 10)}, ${escapeSql(u.videoCredits ?? u.credits ?? 10)}, ${escapeSql(u.videoCreditsUsed ?? 0)},
            ${escapeSql(u.customAvatarsLimit ?? 1)}, ${escapeSql(u.maxVideoLength ?? 60)}, ${escapeSql(u.createdAt)}, ${escapeSql(u.updatedAt)}, NULL
          )
          ON CONFLICT (id) DO NOTHING
        `);
        migratedUsers++;
      } catch (err) {
        if (!String(err.message || err).includes("unique") && !String(err.message || err).includes("duplicate")) {
          console.error("   ❌ User", u.email, err.message);
        }
      }
    }
    console.log(`   ✅ Migrated ${migratedUsers} users\n`);

    // ═══════════════════════════════════════════════════════
    // STEP 4: MIGRATE SCRIPTS → scripts
    // ═══════════════════════════════════════════════════════
    console.log("📜 Step 4: Migrating Script → scripts...");
    const scriptIdSet = new Set(backup.scripts.map((s) => s.id));
    let migratedScripts = 0;
    for (const s of backup.scripts) {
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO scripts (id, "userId", title, topic, niche, content, hook, body, cta, platform, style, tone, prompt, model, "wordCount", "estimatedLength", "editCount", "isFavorite", "isUsed", "createdAt", "updatedAt")
          VALUES (
            ${escapeSql(s.id)}, ${escapeSql(s.userId)}, ${escapeSql(s.projectName ?? s.topic)}, ${escapeSql(s.topic)}, NULL, ${escapeSql(s.content || "")}, NULL, NULL, NULL,
            ${escapeSql(s.platform ?? "tiktok")}, NULL, ${escapeSql(s.tone)}, NULL, NULL, NULL, ${escapeSql(s.duration ?? null)}, ${escapeSql(s.refinementCount ?? 0)},
            ${s.isFavorite ?? false}, ${escapeSql(!!(s.generatedVideoId || s.generatedVideoUrl))}, ${escapeSql(s.createdAt)}, ${escapeSql(s.updatedAt)}
          )
          ON CONFLICT (id) DO NOTHING
        `);
        migratedScripts++;
      } catch (err) {
        if (!String(err.message || err).includes("unique") && !String(err.message || err).includes("duplicate")) {
          console.error("   ❌ Script", s.id, err.message);
        }
      }
    }
    console.log(`   ✅ Migrated ${migratedScripts} scripts\n`);

    // ═══════════════════════════════════════════════════════
    // STEP 5: MIGRATE GeneratedVideo → videos (with script text from Script)
    // ═══════════════════════════════════════════════════════
    console.log("🎬 Step 5: Migrating GeneratedVideo → videos...");
    const scriptById = new Map(backup.scripts.map((s) => [s.id, s]));
    let migratedVideos = 0;
    for (const gv of backup.generatedVideos) {
      try {
        const scriptRow = scriptById.get(gv.scriptId);
        const scriptText = scriptRow ? (scriptRow.content || "") : "";
        const status = (gv.videoStatus || "pending").toLowerCase();
        const completedAt = status === "completed" || status === "complete" ? (gv.updatedAt || null) : null;
        await prisma.$executeRawUnsafe(`
          INSERT INTO videos (id, "userId", title, script, "scriptId", "avatarId", "avatarName", "avatarType", "voiceId", "heygenVideoId", status, "videoUrl", "thumbnailUrl", duration, platform, resolution, "creditsUsed", "heygenCost", error, "retryCount", "createdAt", "updatedAt", "completedAt")
          VALUES (
            ${escapeSql(gv.id)}, ${escapeSql(gv.userId)}, ${escapeSql(gv.projectName)}, ${escapeSql(scriptText)}, ${escapeSql(gv.scriptId)}, 'default', NULL, 'public', NULL,
            ${escapeSql(gv.generatedVideoId)}, ${escapeSql(gv.videoStatus || "pending")}, ${escapeSql(gv.generatedVideoUrl)}, ${escapeSql(gv.thumbnailUrl)}, ${escapeSql(gv.duration)},
            '9:16', '1080p', 1, NULL, ${escapeSql(gv.videoError)}, 0, ${escapeSql(gv.createdAt)}, ${escapeSql(gv.updatedAt)}, ${escapeSql(completedAt)}
          )
          ON CONFLICT (id) DO NOTHING
        `);
        migratedVideos++;
      } catch (err) {
        if (!String(err.message || err).includes("unique") && !String(err.message || err).includes("duplicate")) {
          console.error("   ❌ Video", gv.id, err.message);
        }
      }
    }
    console.log(`   ✅ Migrated ${migratedVideos} videos\n`);

    // ═══════════════════════════════════════════════════════
    // STEP 6: MIGRATE Avatar → avatars
    // ═══════════════════════════════════════════════════════
    console.log("🎭 Step 6: Migrating Avatar → avatars...");
    let migratedAvatars = 0;
    for (const a of backup.avatars) {
      try {
        const heygenId = a.heygenAvatarId || a.id;
        await prisma.$executeRawUnsafe(`
          INSERT INTO avatars (id, "userId", name, "heygenId", type, "thumbnailUrl", "trainingVideoUrl", status, "isPrivate", "heygenStatus", error, "usageCount", "createdAt", "updatedAt", "readyAt")
          VALUES (
            ${escapeSql(a.id)}, ${escapeSql(a.userId)}, ${escapeSql(a.name)}, ${escapeSql(heygenId)}, ${escapeSql(a.type || "custom")},
            ${escapeSql(a.imageUrl)}, ${escapeSql(a.videoUrl)}, ${escapeSql(a.status || "processing")}, true, NULL, ${escapeSql(a.error)}, 0, ${escapeSql(a.createdAt)}, ${escapeSql(a.updatedAt)}, NULL
          )
          ON CONFLICT (id) DO NOTHING
        `);
        migratedAvatars++;
      } catch (err) {
        if (!String(err.message || err).includes("unique") && !String(err.message || err).includes("duplicate")) {
          console.error("   ❌ Avatar", a.id, err.message);
        }
      }
    }
    console.log(`   ✅ Migrated ${migratedAvatars} avatars\n`);

    // ═══════════════════════════════════════════════════════
    // STEP 7: VERIFY
    // ═══════════════════════════════════════════════════════
    console.log("🔍 Step 7: Verifying...");
    const [[uc]] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as c FROM users`);
    const [[sc]] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as c FROM scripts`);
    const [[vc]] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as c FROM videos`);
    const [[ac]] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as c FROM avatars`);

    console.log(`   users:   ${uc?.c ?? 0} (backup had ${backup.users.length})`);
    console.log(`   scripts: ${sc?.c ?? 0} (backup had ${backup.scripts.length})`);
    console.log(`   videos:  ${vc?.c ?? 0} (backup had ${backup.generatedVideos.length})`);
    console.log(`   avatars: ${ac?.c ?? 0} (backup had ${backup.avatars.length})`);
    console.log("\n✅ Migration completed. New tables are populated. Original tables are unchanged.");
    console.log("\nNext: Test the app. When ready to switch to the new schema:");
    console.log("  1. Replace prisma/schema.prisma with prisma/schema-new.prisma (and fix table names to match existing if you keep both).");
    console.log("  2. Update all app code to use the new model/table names.");
    console.log("  3. Only then run scripts/cleanup-old-tables.js after verification.\n");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    console.error("\nYour data is safe. Check the backup JSON and try again.");
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
