import { useEffect, useState } from 'react'
import pictr from './assets/Eduvisionlogo.png'
import { checkBackendHealth } from '../utils/api.js'

function Login({ authError, authLoading, onLogin, onRegister }) {
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [connection, setConnection] = useState('checking')
  const isLogin = mode === 'login'
  const form = isLogin ? loginForm : registerForm

  useEffect(() => {
    let cancelled = false
    checkBackendHealth().then(() => {
      if (!cancelled) setConnection('ready')
    }).catch(() => {
      if (!cancelled) setConnection('unavailable')
    })
    return () => { cancelled = true }
  }, [])

  function updateField(event) {
    const { name, value } = event.target
    const nextValue = name === 'email' ? value.replace(/\s+/g, '') : value
    const update = isLogin ? setLoginForm : setRegisterForm
    update(current => ({ ...current, [name]: nextValue }))
    event.target.setCustomValidity('')
  }

  function submit(event) {
    event.preventDefault()
    const values = { ...form, email: form.email.trim().toLowerCase() }
    if (isLogin) onLogin(values)
    else onRegister({ ...values, name: values.name.trim().replace(/\s+/g, ' ') })
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <img className="LoginImage" src={pictr} alt="EduVision" />
        <p className="eyebrow auth-eyebrow">Teacher portal</p>
        <h1 className="auth-title" id="auth-title">{isLogin ? 'Welcome back.' : 'Your classroom starts here.'}</h1>
        <p className="auth-copy">{isLogin ? 'A little less roll call. A little more teaching.' : 'Create your account to start taking attendance.'}</p>

        <div className="auth-toggle" aria-label="Account access">
          {['login', 'register'].map(value => (
            <button key={value} className={`auth-toggle-button ${mode === value ? 'active' : ''}`}
              aria-pressed={mode === value} disabled={authLoading} type="button"
              onClick={() => { setMode(value); setShowPassword(false) }}>
              {value === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        <form className="auth-form" onSubmit={submit}>
          {!isLogin && <label className="auth-field" htmlFor="teacher-name">Full name
            <input id="teacher-name" name="name" autoComplete="name" placeholder="Your full name" value={form.name} onChange={updateField} required disabled={authLoading} />
          </label>}
          <label className="auth-field" htmlFor="teacher-email">Email address
            <input id="teacher-email" name="email" type="email" autoComplete="email" placeholder="you@unt.edu"
              value={form.email} onChange={updateField} required disabled={authLoading}
              onInvalid={event => event.target.setCustomValidity('Please enter a valid email address.')} />
          </label>
          <label className="auth-field" htmlFor="teacher-password">Password</label>
          <div className="password-field">
            <input id="teacher-password" name="password" type={showPassword ? 'text' : 'password'}
              autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder={isLogin ? 'Enter your password' : 'Choose a password'}
              value={form.password} onChange={updateField} required disabled={authLoading} />
            <button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          {authError && <p className="auth-message error" role="alert">{authError}</p>}
          {connection === 'unavailable' && <p className="auth-message error" role="status">Unable to connect. Please check your connection and try again.</p>}
          <button className="Login-button" disabled={authLoading} type="submit">
            {authLoading ? (isLogin ? 'Logging in…' : 'Creating account…') : (isLogin ? 'Log in to your classroom' : 'Create account')}
            {!authLoading && <span aria-hidden="true">→</span>}
          </button>
        </form>
        <p className="auth-footnote">Manage sessions. Follow check-ins. Stay present.</p>
      </section>
      <p className="auth-footer">EduVision <span aria-hidden="true">·</span> A clearer view of your classroom</p>
    </main>
  )
}

export default Login
