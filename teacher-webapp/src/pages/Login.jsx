import { useState } from 'react'
import pictr from './assets/Eduvisionlogo.png'

const EMPTY_LOGIN = { email: '', password: '' }
const EMPTY_REGISTER = { name: '', email: '', password: '' }

function Login({ authError, authLoading, onLogin, onRegister }) {
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN)
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER)

  function updateLoginField(event) {
    const { name, value } = event.target
    setLoginForm((current) => ({ ...current, [name]: value }))
  }

  function updateRegisterField(event) {
    const { name, value } = event.target
    setRegisterForm((current) => ({ ...current, [name]: value }))
  }

  function submitLogin(event) {
    event.preventDefault()
    onLogin(loginForm)
  }

  function submitRegister(event) {
    event.preventDefault()
    onRegister(registerForm)
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <img className="LoginImage" src={pictr} alt="EduVision" />
        <h1 className="auth-title">Teacher Portal</h1>
        <p className="auth-copy">Log in to manage attendance sessions and monitor student check-ins.</p>

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
