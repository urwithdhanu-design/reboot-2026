-- Platform admin role on KYC users table (idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'customer';
