ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;
CREATE TABLE account_action_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose VARCHAR(16) NOT NULL CHECK (purpose IN ('RESET','VERIFY')),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ
);
CREATE INDEX account_action_tokens_user_purpose_idx ON account_action_tokens(user_id, purpose, created_at);
CREATE INDEX account_action_tokens_expiry_idx ON account_action_tokens(expires_at);
