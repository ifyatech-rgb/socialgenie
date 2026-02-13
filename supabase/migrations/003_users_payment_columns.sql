-- Add payment and Stripe columns to users table (Supabase sync)
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Existing users: mark as paid
UPDATE users SET payment_status = 'paid' WHERE payment_status IS NULL OR payment_status = 'pending';
