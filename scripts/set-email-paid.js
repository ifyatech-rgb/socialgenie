/**
 * One-off script: set a user by email to paid (Creator plan) so they can use the app.
 * Run from project root: node scripts/set-email-paid.js
 * Requires DATABASE_URL in .env (or run: node --env-file=.env scripts/set-email-paid.js)
 */

const path = require("path");
const fs = require("fs");

// Load .env from project root
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
} catch (e) {
  // .env optional if vars set elsewhere
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const EMAIL = "pkdigitalldreamers@gmail.com";
const CREATOR_PLAN = {
  plan: "creator",
  payment_status: "paid",
  videoCredits: 20,
  videoCreditsUsed: 0,
  genieEdits: 50,
  genieEditsUsed: 0,
  customAvatarsLimit: 5,
  customAvatarsUsed: 0,
  maxVideoLength: 90,
  exportQuality: "720p",
  hasWatermark: false,
  credits: 20,
};

async function main() {
  const email = EMAIL.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    console.error("User not found with email:", EMAIL);
    console.error("Sign up first at /auth/signup, then run this script again.");
    process.exit(1);
  }
  await prisma.user.update({
    where: { email },
    data: CREATOR_PLAN,
  });
  console.log("Done. Set", EMAIL, "to paid (Creator plan).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
