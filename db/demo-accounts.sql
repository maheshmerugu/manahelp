-- Demo accounts for ManaHelp. Run AFTER db/schema.sql in the Vercel Postgres / Neon SQL editor.
--
-- If your database was created before the 'admin' role existed, run db/migrate.sql first,
-- otherwise the admin INSERT fails on the old users_role_check constraint.
--
-- Log in from the normal sign-in form with these:
--   admin     admin@manahelp.in      Admin@123
--   customer  customer@manahelp.in   Customer@123
--   provider  provider@manahelp.in   Provider@123
--
-- These passwords are demo-only. Change them (or delete these rows) before going live.
-- To change a password, generate a fresh hash with:
--   node -e "console.log(require('bcryptjs').hashSync('NewPass@123', 10))"
--   UPDATE users SET password_hash = '<hash>' WHERE email = 'admin@manahelp.in';
--
-- The admin email should also be set as ADMIN_EMAIL in Vercel environment variables, so the
-- account keeps its admin rights even if the stored role is ever reset.

INSERT INTO users (email, password_hash, name, mobile, role, city, area, service, verified) VALUES
  ('admin@manahelp.in',
   '$2a$10$k5HPWAeCwzIDm6wkNMtgsOfRGIVpex1rZHrdTFq60VIVuanNIMIGa',
   'ManaHelp Admin', '9000000001', 'admin', 'Hyderabad', 'Kukatpally', NULL, true),

  ('customer@manahelp.in',
   '$2a$10$SGWtKIzPSYyC2qUKMBtQ7uG1g134noCg9trGFHQrzzpzwx9dKGj8a',
   'Test Customer', '9000000002', 'customer', 'Hyderabad', 'Madhapur', NULL, false),

  ('provider@manahelp.in',
   '$2a$10$KhezfqoJ3kSwZHcFptqIAuXzO4RShWQORa8B5HYuJOIygedL272v6',
   'Test Plumber', '9000000003', 'provider', 'Hyderabad', 'Kukatpally', 'Plumber', true)
ON CONFLICT (email) DO NOTHING;
