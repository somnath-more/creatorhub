CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT ck_users_canonical_email CHECK (email = lower(trim(email)) AND length(email) > 0),
    CONSTRAINT ck_users_full_name CHECK (length(trim(full_name)) > 0),
    CONSTRAINT ck_users_password_hash CHECK (length(password_hash) > 0)
);
