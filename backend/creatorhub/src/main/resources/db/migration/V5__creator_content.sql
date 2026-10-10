CREATE TABLE identity_verifications (
    creator_id UUID PRIMARY KEY REFERENCES creators(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED','IN_PROGRESS','SUBMITTED','VERIFIED')),
    step INTEGER NOT NULL DEFAULT 1 CHECK (step BETWEEN 1 AND 4),
    full_name VARCHAR(100) NOT NULL DEFAULT '',
    date_of_birth VARCHAR(10) NOT NULL DEFAULT '',
    country VARCHAR(80) NOT NULL DEFAULT '',
    document_type VARCHAR(20) NOT NULL DEFAULT '' CHECK (document_type IN ('','PASSPORT','NATIONAL_ID','DRIVING_LICENSE')),
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    CHECK ((status IN ('SUBMITTED','VERIFIED')) = (step = 4 AND submitted_at IS NOT NULL)),
    CHECK ((status = 'VERIFIED') = (approved_at IS NOT NULL))
);
CREATE TABLE content (
    id UUID PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL CHECK (length(trim(title)) > 0),
    description VARCHAR(5000) NOT NULL CHECK (length(trim(description)) > 0),
    price_cents INTEGER NOT NULL CHECK (price_cents BETWEEN 0 AND 99999999),
    status VARCHAR(16) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','SCHEDULED')),
    media_ready BOOLEAN NOT NULL DEFAULT FALSE,
    thumbnail_name VARCHAR(255), thumbnail_size BIGINT, thumbnail_type VARCHAR(100),
    video_name VARCHAR(255), video_size BIGINT, video_type VARCHAR(100),
    scheduled_at TIMESTAMPTZ, published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CHECK (status = 'DRAFT' OR (media_ready AND thumbnail_name IS NOT NULL AND video_name IS NOT NULL)),
    CHECK ((status = 'SCHEDULED') = (scheduled_at IS NOT NULL)),
    CHECK ((status = 'PUBLISHED') = (published_at IS NOT NULL)),
    CHECK ((thumbnail_name IS NULL AND thumbnail_size IS NULL AND thumbnail_type IS NULL) OR
           (thumbnail_name IS NOT NULL AND thumbnail_size BETWEEN 1 AND 5242880 AND thumbnail_type IN ('image/jpeg','image/png','image/webp'))),
    CHECK ((video_name IS NULL AND video_size IS NULL AND video_type IS NULL) OR
           (video_name IS NOT NULL AND video_size BETWEEN 1 AND 2147483648 AND video_type IN ('video/mp4','video/webm','video/quicktime')))
);
CREATE INDEX ix_content_creator_updated ON content(creator_id, updated_at DESC, id);
CREATE INDEX ix_content_due ON content(scheduled_at, id) WHERE status = 'SCHEDULED';
