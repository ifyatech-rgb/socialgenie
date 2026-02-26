/**
 * Cleanup Old Tables Script
 * Drops old Prisma tables (User, Script, Avatar, Video, GeneratedVideo, etc.)
 * so only the new clean tables (users, videos, scripts, avatars) remain.
 *
 * ⚠️ WARNING: After running this, your app will BREAK until you:
 *   1. Switch Prisma schema to use the new tables (users, scripts, avatars, videos)
 *   2. Update all app code and NextAuth to use the new schema
 *   Make sure you have a backup (backup-*.json and pg_dump) before running!
 *
 * Usage: node scripts/cleanup-old-tables.js
 */

const path = require("path");
const readline = require("readline");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function loadEnv() {
  try {
    const envPath = path.join(__dirname, "..", ".env");
    const content = require("fs").readFileSync(envPath, "utf8");
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

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  loadEnv();

  console.log("⚠️  OLD TABLE CLEANUP SCRIPT\n");
  console.log("This will DROP these old tables (replaced by users, videos, scripts, avatars):");
  console.log('   "GeneratedVideo", "Script", "Avatar", "Video", "Subscription",');
  console.log('   "Onboarding", "TrainingVideo", "Activity", "Session", "Account", "User"\n');
  console.log("Your NEW tables (users, videos, scripts, avatars) will NOT be touched.");
  console.log("⚠️  The app will break until you switch to the new schema and update code!\n");

  const answer = await ask('Type "yes" to confirm and drop all old tables: ');
  if (answer !== "yes") {
    console.log("❌ Cleanup cancelled. No tables were dropped.");
    return;
  }

  console.log("\n🗑️  Dropping old tables (in dependency order)...\n");

  const tablesToDrop = [
    "GeneratedVideo",
    "Script",
    "Avatar",
    "Video",
    "Subscription",
    "Onboarding",
    "TrainingVideo",
    "Activity",
    "Session",
    "Account",
    "User",
  ];

  try {
    for (const table of tablesToDrop) {
      try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`   ✅ Dropped "${table}"`);
      } catch (err) {
        console.log(`   ⏭️  "${table}" ${err.message?.includes("does not exist") ? "already gone" : "error: " + err.message}`);
      }
    }

    console.log("\n✅ Cleanup completed. Old tables removed.");
    console.log("   Remaining: users, videos, scripts, avatars, profiles, Waitlist, VerificationToken (if any).\n");
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    console.error("   Your new tables (users, videos, scripts, avatars) are safe.\n");
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
