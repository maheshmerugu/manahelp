import { sql } from '@vercel/postgres'
import { hashPassword, signToken, publicUser, isEmail, isAdminEmail, notify } from '../../lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const { email, password, name, mobile, role, city, area, service, latitude, longitude } = req.body || {}
  const mail = (email || '').toString().trim().toLowerCase()
  const nm = (name || '').toString().trim().slice(0, 80)
  const cty = (city || '').toString().trim().slice(0, 60)
  const lat = Number.isFinite(Number(latitude)) ? Number(latitude) : null
  const lng = Number.isFinite(Number(longitude)) ? Number(longitude) : null
  // The designated admin email always becomes an admin, regardless of the picked role.
  const r = isAdminEmail(mail) ? 'admin' : role === 'provider' ? 'provider' : 'customer'

  if (!isEmail(mail)) return res.status(400).json({ ok: false, error: 'Enter a valid email address.' })
  if (!nm) return res.status(400).json({ ok: false, error: 'Please enter your name.' })
  if (!password || password.length < 6)
    return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters.' })
  if (r === 'provider' && !service)
    return res.status(400).json({ ok: false, error: 'Please choose the service you provide.' })
  if (r === 'provider' && !cty)
    return res.status(400).json({ ok: false, error: 'Please enter your city so we can match you with nearby jobs.' })

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${mail}`
    if (existing.rows.length)
      return res.status(409).json({ ok: false, error: 'An account with this email already exists.' })

    const hash = await hashPassword(password)
    const insertUser = (dbRole) => sql`
      INSERT INTO users (email, password_hash, name, mobile, role, city, area, latitude, longitude, service)
      VALUES (${mail}, ${hash}, ${nm}, ${(mobile || '').toString().slice(0, 15) || null},
              ${dbRole}, ${cty || null}, ${(area || '').toString().slice(0, 80) || null},
              ${lat}, ${lng},
              ${r === 'provider' ? service.toString().slice(0, 60) : null})
      RETURNING *`
    let inserted
    try {
      inserted = await insertUser(r)
    } catch (e) {
      // 23514 = old CHECK constraint that only allows customer/provider. Store the account
      // as a customer; admin rights are derived from ADMIN_EMAIL on every request.
      if (e.code === '23514' && r === 'admin') inserted = await insertUser('customer')
      else throw e
    }
    const user = { ...inserted.rows[0], ...(isAdminEmail(mail) ? { role: 'admin' } : {}) }
    await notify(user.id, {
      title: `Welcome to ManaHelp, ${user.name.split(' ')[0]}! 🤝`,
      body:
        r === 'provider'
          ? 'Your helper account is ready. New customer requests in your area will show up here.'
          : 'Your account is ready. Post a request and verified helpers near you will respond.',
      type: 'welcome',
      link: '/dashboard',
    })
    return res.status(201).json({ ok: true, token: signToken(user), user: publicUser(user) })
  } catch (e) {
    if (e.code === '23505')
      return res.status(409).json({ ok: false, error: 'An account with this email already exists.' })
    return res.status(500).json({ ok: false, error: e.message })
  }
}
