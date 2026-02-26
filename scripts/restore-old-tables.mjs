/**
 * Restore app after cleanup: recreate old tables and copy user data back.
 * Run this if you see "Database connection failed" after dropping old tables.
 *
 * Step 1: Recreate tables from current Prisma schema (run in terminal):
 *   npx prisma db push
 *
 * Step 2: Copy user data from "users" back into "User" (this script):
 *   node scripts/restore-old-tables.mjs
 *
 * Then restart the app. Users will need to log in again (Session/Account are recreated on login).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Restoring user data from "users" into "User"...\n');

  try {
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM users');
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log('   No rows in "users" table. Nothing to copy.');
      await prisma.$disconnect();
      return;
    }

    let copied = 0;
    for (const u of rows) {
      try {
        const vidCredits = u.videoCredits ?? u.video_credits ?? 10;
        await prisma.$executeRawUnsafe(
          `INSERT INTO "User" (
            id, email, name, password, plan,
            "stripe_customer_id", "stripe_subscription_id", "subscription_status",
            credits, "videoCredits", "videoCreditsUsed", "customAvatarsLimit", "maxVideoLength",
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id) DO NOTHING`,
          u.id,
          u.email,
          u.name ?? null,
          u.password ?? null,
          u.plan ?? 'trial',
          u.stripeCustomerId ?? u.stripe_customer_id ?? null,
          u.stripeSubscriptionId ?? u.stripe_subscription_id ?? null,
          u.subscriptionStatus ?? u.subscription_status ?? null,
          vidCredits,
          vidCredits,
          u.videoCreditsUsed ?? u.video_credits_used ?? 0,
          u.customAvatarsLimit ?? u.custom_avatars_limit ?? 1,
          u.maxVideoLength ?? u.max_video_length ?? 60,
          u.createdAt ?? u.created_at ?? new Date(),
          u.updatedAt ?? u.updated_at ?? new Date()
        );
        copied++;
        console.log(`   ✅ ${u.email}`);
      } catch (err) {
        if (String(err?.message || '').includes('unique') || String(err?.message || '').includes('duplicate')) {
          console.log(`   ⏭️  ${u.email} (already exists)`);
        } else {
          console.error(`   ❌ ${u.email}:`, err.message);
        }
      }
    }

    console.log(`\n✅ Done. Copied ${copied} users into "User" table.`);
    console.log('   Restart the app and try logging in again.\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n   Make sure you ran: npx prisma db push\n');
    process.exit(1);
  }
}

main()
  .finally(() => prisma.$disconnect());
