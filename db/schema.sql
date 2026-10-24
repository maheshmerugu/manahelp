-- ManaHelp schema. Run once in the Vercel Postgres / Neon SQL editor after creating the store.
-- Optional afterwards: db/demo-accounts.sql (admin + customer + provider logins).

-- Public marketing leads (from the landing-page signup form)
CREATE TABLE IF NOT EXISTS signups (
  id         SERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,
  mobile     VARCHAR(10) NOT NULL UNIQUE,
  area       TEXT,
  service    TEXT,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS signups_created_at_idx ON signups (created_at DESC);

-- Registered accounts: customers and service providers (helpers)
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  mobile        VARCHAR(15),
  role          TEXT        NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','provider','admin')),
  city          TEXT,               -- free-text city, e.g. 'Hyderabad' (works anywhere in India)
  area          TEXT,               -- locality within the city
  latitude      DOUBLE PRECISION,   -- captured from browser geolocation at signup
  longitude     DOUBLE PRECISION,
  service       TEXT,               -- provider's primary service (null for customers)
  verified      BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

-- Service requests posted by customers, accepted by providers
CREATE TABLE IF NOT EXISTS bookings (
  id           SERIAL PRIMARY KEY,
  customer_id  INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id  INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  service      TEXT        NOT NULL,
  city         TEXT,
  area         TEXT,
  description  TEXT,
  needed_by    TEXT,               -- 'Now' | 'Today' | 'Tomorrow' | free text
  status       TEXT        NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','accepted','completed','cancelled')),
  price        NUMERIC(10,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_customer_idx ON bookings (customer_id);
CREATE INDEX IF NOT EXISTS bookings_provider_idx ON bookings (provider_id);
CREATE INDEX IF NOT EXISTS bookings_status_service_idx ON bookings (status, service);
CREATE INDEX IF NOT EXISTS bookings_match_idx ON bookings (status, service, city);

-- In-app notifications (bell)
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  body       TEXT,
  type       TEXT,               -- e.g. 'booking_new','booking_accepted','booking_completed'
  link       TEXT,               -- optional client route, e.g. '/dashboard'
  read       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, read, created_at DESC);

-- Services are managed from the admin panel (no longer hardcoded in the frontend)
CREATE TABLE IF NOT EXISTS services (
  id         SERIAL PRIMARY KEY,
  name       TEXT        NOT NULL UNIQUE,
  icon       TEXT        NOT NULL DEFAULT '🛠️',
  blurb      TEXT,
  eta        TEXT,
  active     BOOLEAN     NOT NULL DEFAULT true,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS services_active_idx ON services (active, sort_order);

-- Seed the default catalogue (safe to re-run; skips existing names)
INSERT INTO services (name, icon, blurb, eta, sort_order) VALUES
  ('Plumber',                  '🔧', 'Leaks, taps, fittings, bathroom fixes',        'within 45 min', 1),
  ('Electrician',              '💡', 'Wiring, switches, fans, inverter issues',      'within 45 min', 2),
  ('Home Cleaning',            '🧹', 'Deep clean, kitchen, bathroom, sofa',          'same day',      3),
  ('Bike & Car Repair',        '🛵', 'Doorstep service, puncture, battery',          'within 60 min', 4),
  ('AC & Appliance Service',   '❄️', 'AC, fridge, washing machine repair',           'same day',      5),
  ('Home Tutors',              '📚', '1st–10th, intermediate, competitive exams',    'within 24 hrs', 6),
  ('Grocery & Medicine Runs',  '🛒', 'Groceries, pharmacy, documents pickup',        'within 90 min', 7),
  ('Elder Care Assist',        '🧓', 'Hospital accompaniment, daily check-ins',      'same day',      8),
  ('Pet Care',                 '🐶', 'Feeding visits, walks, vet drops',             'same day',      9),
  ('Packing & Moving',         '📦', 'Within-city shifting with helpers',            'within 24 hrs', 10),
  ('Salon at Home',            '💇', 'Haircut, facial, mehndi for women & men',      'within 2 hrs',  11),
  ('Emergency Guidance',       '🚨', 'Free step-by-step help till help arrives',     'instant',       12)
ON CONFLICT (name) DO NOTHING;

-- Post-create migrations. These actually run (not comments) and are safe to re-run.
-- Needed when the database was created before the admin role or multi-city support.
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

