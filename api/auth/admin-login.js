import { sql } from '@vercel/postgres'
import {
  verifyPassword,
  signToken,
  signAdminToken,
  publicUser,
  syntheticAdmin,
  isAdmin,
  matchesAdminKey,
  ensureAdminRole,
  apiError,
} from '../../lib/auth.js'

// Admin sign-in with two ways in: the admin account password, or the ADMIN_KEY secret.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const { email, password, key } = req.body || {}
  const mail = (email || '').toString().trim().toLowerCase()

  // ---- Admin key: no account and no database access needed ----
  if (key) {
    if (!process.env.ADMIN_KEY)
      return res.status(400).json({ ok: false, error: 'Admin-key login is off — ADMIN_KEY is not set on this deployment. Use the admin account tab instead.' })
    if (!matchesAdminKey(key)) return res.status(401).json({ ok: false, error: 'Invalid admin key.' })
    const user = syntheticAdmin(mail)
    return res.status(200).json({ ok: true, token: signAdminToken(mail), user })
  }

  // ---- Admin account password (role='admin' in the DB, or matching ADMIN_EMAIL) ----
  if (!mail || !password)
    return res.status(400).json({ ok: false, error: 'Enter the admin email and password, or use the admin key tab.' })

  try {
    const { rows } = await sql`SELECT * FROM users WHERE email = ${mail}`
    const found = rows[0]
    if (!found || !(await verifyPassword(password, found.password_hash)))
      return res.status(401).json({ ok: false, error: 'Invalid admin email or password.' })
    if (!isAdmin(found))
      return res.status(403).json({
        ok: false,
        error: 'That account has no admin access. Set ADMIN_EMAIL to this address, or sign in with the admin key.',
      })
    const user = await ensureAdminRole(found)
    return res.status(200).json({ ok: true, token: signToken(user), user: publicUser(user) })
  } catch (e) {
    return res.status(500).json({ ok: false, error: apiError(e) })
  }
}
