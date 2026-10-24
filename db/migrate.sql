-- Run this once in the Vercel Postgres / Neon SQL editor on a database that was
-- created before admin roles and multi-city support existed. Safe to re-run.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer','provider','admin'));

ALTER TABLE users    ADD COLUMN IF NOT EXISTS city      TEXT;
ALTER TABLE users    ADD COLUMN IF NOT EXISTS area      TEXT;
ALTER TABLE users    ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION;
ALTER TABLE users    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE users    ADD COLUMN IF NOT EXISTS service   TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS city      TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS area      TEXT;
CREATE INDEX IF NOT EXISTS bookings_match_idx ON bookings (status, service, city);
