async function request(path, options = {}) {
  const response = await fetch(`http://localhost:5000${path}`, {
    method: options.method,
    body: options.body,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })

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
