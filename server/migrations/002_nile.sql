-- Additive migration: preserve central Saerbridge UUIDs and sessions.
ALTER TABLE users ALTER COLUMN google_sub DROP NOT NULL;
CREATE TABLE email_challenges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL,
 token_hash text NOT NULL, attempts integer NOT NULL DEFAULT 0,
 expires_at timestamptz NOT NULL, consumed_at timestamptz
);
CREATE TABLE organizations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
 kind text NOT NULL DEFAULT 'organization' CHECK(kind IN ('organization','saerbridge')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_saerbridge ON organizations(kind) WHERE kind='saerbridge';
CREATE TABLE memberships (
 organization_id uuid REFERENCES organizations(id), user_id uuid REFERENCES users(id),
 role text NOT NULL CHECK(role IN ('owner','researcher','viewer')),
 PRIMARY KEY(organization_id,user_id)
);
CREATE TABLE nile_transcripts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 uploaded_by uuid NOT NULL REFERENCES users(id), township text NOT NULL CHECK(township IN ('greenbushes','walmer-township')),
 title text NOT NULL, text_cipher text NOT NULL, content_hash text NOT NULL,
 consent_reference text NOT NULL, demonstration boolean NOT NULL DEFAULT false,
 status text NOT NULL DEFAULT 'privacy_review' CHECK(status IN ('privacy_review','queued','processing','analysis_review','approved','rejected','failed')),
 privacy_reviewed_by uuid REFERENCES users(id), reviewed_by uuid REFERENCES users(id),
 analysis jsonb, model text, prompt_version text, failure_code text,
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '90 days',
 UNIQUE(organization_id,content_hash)
);
CREATE INDEX nile_org_transcripts ON nile_transcripts(organization_id,created_at DESC);
CREATE TABLE nile_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), transcript_id uuid NOT NULL UNIQUE REFERENCES nile_transcripts(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'queued', attempts integer NOT NULL DEFAULT 0,
 available_at timestamptz NOT NULL DEFAULT now(), locked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE nile_releases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 published_by uuid NOT NULL REFERENCES users(id), archive jsonb NOT NULL,
 demonstration boolean NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), withdrawn_at timestamptz
);
CREATE TABLE api_keys (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
 organization_id uuid REFERENCES organizations(id), label text NOT NULL, token_hash text UNIQUE NOT NULL,
 expires_at timestamptz NOT NULL DEFAULT now()+interval '90 days', revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE usage_buckets (
 key text NOT NULL, bucket bigint NOT NULL, used integer NOT NULL DEFAULT 0,
 PRIMARY KEY(key,bucket)
);
CREATE TABLE ai_budgets (
 organization_id uuid NOT NULL REFERENCES organizations(id), month text NOT NULL,
 reserved_units integer NOT NULL DEFAULT 0, PRIMARY KEY(organization_id,month)
);
CREATE TABLE nile_audit (
 id bigserial PRIMARY KEY, actor_id uuid REFERENCES users(id), organization_id uuid REFERENCES organizations(id),
 action text NOT NULL, resource_id uuid, created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO organizations(name,kind) VALUES ('Saerbridge Research','saerbridge') ON CONFLICT DO NOTHING;
