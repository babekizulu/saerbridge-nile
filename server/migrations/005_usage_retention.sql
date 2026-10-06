ALTER TABLE usage_buckets ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
