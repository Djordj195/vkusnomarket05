-- Vendor credentials: login/password authentication for approved vendors
CREATE TABLE IF NOT EXISTS vendor_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  login TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vendor_credentials_login_unique UNIQUE (login),
  CONSTRAINT vendor_credentials_vendor_unique UNIQUE (vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_credentials_login ON vendor_credentials(login);
CREATE INDEX IF NOT EXISTS idx_vendor_credentials_vendor_id ON vendor_credentials(vendor_id);
