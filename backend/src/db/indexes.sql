-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users (organization_id);

-- Organization indexes
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations (name);
CREATE INDEX IF NOT EXISTS idx_organizations_email ON organizations (email);
CREATE INDEX IF NOT EXISTS idx_organizations_phone ON organizations (phone);
CREATE INDEX IF NOT EXISTS idx_organizations_business_name ON organizations (business_name);

-- Address indexes
CREATE INDEX IF NOT EXISTS idx_addresses_organization_id ON addresses (organization_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_country ON addresses (country);
CREATE INDEX IF NOT EXISTS idx_addresses_city ON addresses (city);

-- API key indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys (key);
CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON api_keys (organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by_id ON api_keys (created_by_id);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);
