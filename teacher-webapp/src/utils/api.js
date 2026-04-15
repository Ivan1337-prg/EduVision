const API_BASE_URL = (
  import.meta.env.VITE_API_SERVER_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000'
).replace(/\/$/, '')
const TUNNEL_BYPASS_HEADERS = {
  Accept: 'application/json',
  'bypass-tunnel-reminder': 'true',
}

async function request(path, options = {}) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method,
      body: options.body,
      headers: {
        ...TUNNEL_BYPASS_HEADERS,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    })
  } catch (error) {
    throw new Error(`Cannot reach backend at ${API_BASE_URL}`)
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('The backend tunnel returned an HTML page instead of JSON. Restart the tunnel or refresh the demo URL configuration.')
  }

  const payload = await response.json()

  if (!response.ok) {
    const detail = Array.isArray(payload.detail)
      ? payload.detail.map((item) => item.msg || JSON.stringify(item)).join(', ')
      : payload.detail

    const error = new Error(detail || payload.message || 'Request failed')
    error.status = response.status
    throw error
  }

  return payload
}

export function checkBackendHealth() {
  return request('/')
}

export function loginTeacher(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function registerTeacher(payload) {
  return request('/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getCurrentSession(token) {
  return request('/session/current', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function startSessionRequest(token) {
  return request('/session/start-session', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export function endSessionRequest(token) {
  return request('/session/end-session', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
