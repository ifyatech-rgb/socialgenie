-- users table (for auth sync - id, email, name, avatar/image, created_at, updated_at)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- credits_log (alias for credits tracking - per user requirements)
CREATE TABLE IF NOT EXISTS credits_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  balance_after INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credits_log_user_id ON credits_log(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_log_created_at ON credits_log(created_at DESC);

-- error_log (alias for error tracking - per user requirements)
CREATE TABLE IF NOT EXISTS error_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  endpoint TEXT,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  status_code INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_error_log_user_id ON error_log(user_id);
CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON error_log(created_at DESC);
