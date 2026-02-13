-- Run this AFTER applying the schema (e.g. prisma db push or migrate).
-- Sets all existing users to payment_status = 'paid' so they keep access.

UPDATE "User"
SET "payment_status" = 'paid'
WHERE "payment_status" IS NULL OR "payment_status" = 'pending';
