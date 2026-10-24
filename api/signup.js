import { sql } from '@vercel/postgres'
import { apiError } from '../lib/auth.js'

// Normalize an Indian mobile number to 10 digits. Returns null if invalid.
function cleanMobile(raw) {
  if (typeof raw !== 'string') return null
  let d = raw.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2) // 91XXXXXXXXXX
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1)  // 0XXXXXXXXXX
  if (d.length !== 10) return null
  if (!/^[6-9]/.test(d)) return null // Indian mobiles start 6-9
  return d
}

export default async function handler(req, res) {
  // Simple shared-secret gate for the admin listing (protects PII).
  if (req.method === 'GET') {
    const key = req.query.key
    if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }
    try {
      const { rows } = await sql`
        SELECT id, name, mobile, area, service, note, created_at
        FROM signups ORDER BY created_at DESC LIMIT 500`
      return res.status(200).json({ ok: true, count: rows.length, signups: rows })
    } catch (e) {
      return res.status(500).json({ ok: false, error: apiError(e) })
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST,GET')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const { name, mobile, area, service, note } = req.body || {}
  const cleanName = (name || '').toString().trim().slice(0, 80)
  const mob = cleanMobile(mobile)

  if (!cleanName) return res.status(400).json({ ok: false, error: 'Please enter your name.' })
  if (!mob) return res.status(400).json({ ok: false, error: 'Enter a valid 10-digit mobile number.' })

  try {
    await sql`
      INSERT INTO signups (name, mobile, area, service, note)
      VALUES (${cleanName}, ${mob}, ${(area || '').toString().slice(0, 80)},
              ${(service || '').toString().slice(0, 60)}, ${(note || '').toString().slice(0, 300)})`
    return res.status(201).json({ ok: true })
  } catch (e) {
    // 23505 = unique violation (duplicate mobile)
    if (e.code === '23505') return res.status(200).json({ ok: true, duplicate: true })
    return res.status(500).json({ ok: false, error: apiError(e) })
  }
}
