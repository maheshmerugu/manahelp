import { sql } from '@vercel/postgres'
import { verifyPassword, signToken, publicUser, ensureAdminRole } from '../../lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const { email, password } = req.body || {}
  const mail = (email || '').toString().trim().toLowerCase()
  if (!mail || !password)
    return res.status(400).json({ ok: false, error: 'Email and password are required.' })

  try {
    const { rows } = await sql`SELECT * FROM users WHERE email = ${mail}`
    const found = rows[0]
    if (!found || !(await verifyPassword(password, found.password_hash)))
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' })

    // The designated admin email is promoted on sight, so the founder never needs manual SQL.
    const user = await ensureAdminRole(found)
    return res.status(200).json({ ok: true, token: signToken(user), user: publicUser(user) })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
}
