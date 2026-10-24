const TOKEN_KEY = 'mh_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

async function req(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const t = getToken()
    if (t) headers.Authorization = `Bearer ${t}`
  }
  let res
  try {
    res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error('Network error. Check your connection.')
  }
  let data = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`)
  // Vite preview serves index.html for /api paths, so a missing API shows up as HTML here.
  if (!data || typeof data !== 'object')
    throw new Error('The API did not answer. Serverless routes only run on Vercel (or `vercel dev`).')
  return data
}

export const api = {
  register: (b) => req('/api/auth/register', { method: 'POST', body: b, auth: false }),
  login: (b) => req('/api/auth/login', { method: 'POST', body: b, auth: false }),
  adminLogin: (b) => req('/api/auth/admin-login', { method: 'POST', body: b, auth: false }),
  me: () => req('/api/auth/me'),
  adminUsers: () => req('/api/admin/users'),
  adminSignups: () => req('/api/admin/signups'),
  bookings: () => req('/api/bookings'),
  createBooking: (b) => req('/api/bookings', { method: 'POST', body: b }),
  updateBooking: (id, b) => req(`/api/bookings/${id}`, { method: 'PATCH', body: b }),
  notifications: () => req('/api/notifications'),
  markRead: (b) => req('/api/notifications', { method: 'POST', body: b }),
  services: () => req('/api/services', { auth: true }),
  createService: (b) => req('/api/services', { method: 'POST', body: b }),
  updateService: (id, b) => req(`/api/services/${id}`, { method: 'PATCH', body: b }),
  deleteService: (id) => req(`/api/services/${id}`, { method: 'DELETE' }),
}
