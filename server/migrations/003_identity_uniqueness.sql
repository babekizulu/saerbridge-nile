-- Deliberately fail on pre-existing duplicate emails; review and reconcile identities manually.
-- Never guess which existing product account owns another account's data.
CREATE UNIQUE INDEX users_unique_active_email ON users(lower(primary_email)) WHERE deleted_at IS NULL;
