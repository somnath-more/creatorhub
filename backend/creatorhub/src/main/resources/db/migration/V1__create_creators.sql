CREATE TABLE creators (
    id UUID PRIMARY KEY,
    principal_reference VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_creators_principal_reference UNIQUE (principal_reference),
    CONSTRAINT ck_creators_principal_not_blank CHECK (length(trim(principal_reference)) > 0)
);
