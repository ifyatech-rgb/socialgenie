/**
 * One-off script: set a user by email to Creator plan.
 * Run from project root: npm run set-creator-plan
 * Requires DATABASE_URL in .env
 */

const path = require("path");
const fs = require("fs");

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
} catch (e) {}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const EMAIL = "pkdigitalldreamers@gmail.com";

async function main() {
  const email = EMAIL.trim().toLowerCase();
  const user = await prisma.users.findUnique({
    where: { email },
  });
  if (!user) {
    console.error("User not found with email:", EMAIL);
    process.exit(1);
  }
  // Ensure DB allows 'creator' plan (in case check constraint excludes it)
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_check;`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE users ADD CONSTRAINT users_plan_check CHECK (plan IN ('trial', 'creator', 'professional', 'enterprise'));`
    );
  } catch (e) {
    // Constraint might not exist or already allow creator; continue
  }
  await prisma.users.update({
    where: { email },
    data: {
      plan: "creator",
      plan_status: "active",
      payment_status: "paid",
      credits: 20,
      video_credits: 20,
      video_credits_used: 0,
      genie_edits: 50,
      custom_avatars_limit: 1,
      custom_avatars_used: user.custom_avatars_used ?? 0,
    },
  });
  console.log("Done. Set", EMAIL, "to Creator plan in Prisma.");
  console.log("To set creator in Supabase: run supabase/migrations/005_add_creator_user_pkdigital.sql in Supabase SQL Editor.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
