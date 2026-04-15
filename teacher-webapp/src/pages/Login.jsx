import { useEffect, useState } from 'react'
import pictr from './assets/Eduvisionlogo.png'
import { checkBackendHealth } from '../utils/api.js'

const EMPTY_LOGIN = { email: '', password: '' }
const EMPTY_REGISTER = { name: '', email: '', password: '' }

function Login({ authError, authLoading, onLogin, onRegister }) {
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN)
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER)
  const [backendStatus, setBackendStatus] = useState('Checking backend...')
  const [backendStatusError, setBackendStatusError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadBackendHealth() {
      try {
        const data = await checkBackendHealth()
        if (cancelled) {
          return
        }

        setBackendStatus(data.message || 'backend running')
        setBackendStatusError(false)
      } catch (error) {
        if (cancelled) {
          return
        }

        setBackendStatus(error.message || 'Backend unavailable')
        setBackendStatusError(true)
      }
    }

    loadBackendHealth()

    return () => {
      cancelled = true
    }
  }, [])

  function updateLoginField(event) {
    const { name, value } = event.target
    const nextValue = name === 'email' ? value.replace(/\s+/g, '') : value
    setLoginForm((current) => ({ ...current, [name]: nextValue }))
  }

  function updateRegisterField(event) {
    const { name, value } = event.target
    const nextValue = name === 'email' ? value.replace(/\s+/g, '') : value
    setRegisterForm((current) => ({ ...current, [name]: nextValue }))
  }

  function handleEmailInvalid(event) {
    event.target.setCustomValidity('Please enter a valid email address.')
  }

  function clearFieldValidation(event) {
    event.target.setCustomValidity('')
  }

  function submitLogin(event) {
    event.preventDefault()
    onLogin({
      ...loginForm,
      email: loginForm.email.trim().toLowerCase(),
    })
  }

  function submitRegister(event) {
    event.preventDefault()
    onRegister({
      ...registerForm,
      name: registerForm.name.trim(),
      email: registerForm.email.trim().toLowerCase(),
    })
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <img className="LoginImage" src={pictr} alt="EduVision" />
        <h1 className="auth-title">Teacher Portal</h1>
        <p className="auth-copy">Log in to manage attendance sessions and monitor student check-ins.</p>
        <p className={`auth-message ${backendStatusError ? 'error' : ''}`}>
          {backendStatus}
        </p>

        <div className="auth-toggle">
          <button
            className={`auth-toggle-button ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={`auth-toggle-button ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {mode === 'login' ? (
          <form className="auth-form" onSubmit={submitLogin}>
            <input
              className="email"
              name="email"
              placeholder="Email"
              type="email"
              value={loginForm.email}
              onChange={updateLoginField}
              onInput={clearFieldValidation}
              onInvalid={handleEmailInvalid}
              autoComplete="email"
              required
            />
            <input
              className="Password"
              name="password"
              placeholder="Password"
              type="password"
              value={loginForm.password}
              onChange={updateLoginField}
              required
            />
            <button className="Login-button" disabled={authLoading} type="submit">
              {authLoading ? 'Logging In...' : 'Login'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={submitRegister}>
            <input
              className="email"
              name="name"
              placeholder="Teacher Name"
              type="text"
              value={registerForm.name}
              onChange={updateRegisterField}
              required
            />
            <input
              className="email"
              name="email"
              placeholder="Email"
              type="email"
              value={registerForm.email}
              onChange={updateRegisterField}
              onInput={clearFieldValidation}
              onInvalid={handleEmailInvalid}
              autoComplete="email"
              required
            />
            <input
              className="Password"
              name="password"
              placeholder="Password"
              type="password"
              value={registerForm.password}
              onChange={updateRegisterField}
              required
            />
            <button className="Login-button" disabled={authLoading} type="submit">
              {authLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        <p className={`auth-message ${authError ? 'error' : ''}`}>
          {authError || ''}
        </p>
      </div>
    </section>
  )
}

export default Login
