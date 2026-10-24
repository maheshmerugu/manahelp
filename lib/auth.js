import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { sql } from '@vercel/postgres'

const SECRET = () => process.env.JWT_SECRET || 'dev-insecure-change-me'
const EXPIRES = '7d'

export const hashPassword = (plain) => bcrypt.hash(plain, 10)
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash)
export const randomSecret = (bytes = 24) => randomBytes(bytes).toString('hex')

// Length-safe, constant-time comparison for shared secrets.
export function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a)).digest()
  const hb = createHash('sha256').update(String(b)).digest()
  return timingSafeEqual(ha, hb)
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, SECRET(), {
    expiresIn: EXPIRES,
  })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET())
  } catch {
    return null
  }
}

// Reads the Authorization: Bearer <token> header, verifies it, and loads the user row.
export async function getUserFromReq(req) {
  const h = req.headers?.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  // Tokens minted by the admin-key login have no account; they are only ever signed after
  // the ADMIN_KEY secret matched, and stop working the moment that secret is removed.
  if (payload.admin === true) {
    if (!process.env.ADMIN_KEY) return null
    return syntheticAdmin(payload.email)
  }
  const { rows } = await sql`SELECT * FROM users WHERE id = ${payload.sub}`
  const user = rows[0] || null
  // Admin identity is anchored to ADMIN_EMAIL, so it keeps working on databases whose
  // role CHECK constraint predates the 'admin' value and rejects the stored role.
  if (user && (payload.role === 'admin' || isAdminEmail(user.email))) user.role = 'admin'
  return user
}

export const syntheticAdmin = (email) => ({
  id: null,
  name: 'Admin',
  email: email || process.env.ADMIN_EMAIL || 'admin',
  role: 'admin',
})

export const signAdminToken = (email) =>
  jwt.sign({ sub: null, admin: true, role: 'admin', email: email || null }, SECRET(), {
    expiresIn: '12h',
  })

// Strip the password hash before sending a user object to the client.
export function publicUser(u) {
  if (!u) return null
  const { password_hash, ...rest } = u
  return rest
}

// Insert an in-app notification for a user. Never throws — notifications are best-effort.
export async function notify(userId, { title, body, type, link }) {
  try {
    await sql`
      INSERT INTO notifications (user_id, title, body, type, link)
      VALUES (${userId}, ${title}, ${body || null}, ${type || null}, ${link || null})`
  } catch (e) {
    console.error('notify failed', e.message)
  }
}

// Turn database errors into something you can act on, instead of a raw driver message.
export function apiError(e) {
  const msg = e?.message || 'Unknown error'
  if (/missing_connection_string/i.test(msg))
    return 'The database is not connected to this deployment. In Vercel: Storage → Create a Postgres store, then redeploy (env vars added after a deploy are not live until you redeploy). Locally: `npx vercel env pull .env.local` and run `npx vercel dev`.'
  if (e?.code === '42703' || e?.code === '23514')
    return `The database schema is out of date — run db/migrate.sql once in the Postgres SQL editor. (${msg})`
  return msg
}

export const isEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

// The account whose email matches ADMIN_EMAIL is treated as an admin.
export const isAdminEmail = (email) =>
  !!process.env.ADMIN_EMAIL &&
  String(email).trim().toLowerCase() === process.env.ADMIN_EMAIL.trim().toLowerCase()

export const isAdmin = (user) =>
  !!user && (user.role === 'admin' || isAdminEmail(user.email))

export const matchesAdminKey = (key) =>
  !!process.env.ADMIN_KEY &&
  typeof key === 'string' &&
  key.length > 0 &&
  safeEqual(key, process.env.ADMIN_KEY)

// Persist role='admin' where the schema allows it. Databases created before the admin role
// still reject it, so fall back to the email-derived admin instead of failing the login.
export async function ensureAdminRole(user) {
  if (!user || user.role === 'admin') return user
  if (!isAdminEmail(user.email)) return user
  try {
    const { rows } = await sql`UPDATE users SET role = 'admin' WHERE id = ${user.id} RETURNING *`
    return rows[0] || { ...user, role: 'admin' }
  } catch (e) {
    if (e.code !== '23514') throw e
    return { ...user, role: 'admin' }
  }
}
