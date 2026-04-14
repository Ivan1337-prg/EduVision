import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import Attendance from './pages/Attendance.jsx'
import Sidebar from './components/Sidebar.jsx'
import Login from './pages/Login.jsx'

import {
  endSessionRequest,
  getCurrentSession,
  loginTeacher,
  registerTeacher,
  startSessionRequest,
} from './utils/api.js'

const TOKEN_STORAGE_KEY = 'eduvision_teacher_token'

function App() {
  const [page, setPage] = useState('dashboard')
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [session, setSession] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionMessage, setSessionMessage] = useState('')

  useEffect(() => {
    if (authToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, authToken)
      return
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }, [authToken])

  useEffect(() => {
    if (!authToken) {
      setSession(null)
      setAttendance([])
      return
    }

    let cancelled = false

    async function loadCurrentSession() {
      setSessionLoading(true)
      setAuthError('')

      try {
        const data = await getCurrentSession(authToken)
        if (cancelled) {
          return
        }

        setSession(data.session)
        setAttendance(data.attendance ?? [])
        if (data.session) {
          setSessionMessage(data.message || 'Active session loaded.')
        } else {
          setSessionMessage('No active session.')
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        if (error.status === 401) {
          setAuthToken('')
          setAuthError('Your session expired. Please log in again.')
        } else {
          setAuthError(error.message)
        }
      } finally {
        if (!cancelled) {
          setSessionLoading(false)
        }
      }
    }

    loadCurrentSession()

    return () => {
      cancelled = true
    }
  }, [authToken])

  useEffect(() => {
    if (!authToken || !session?.session_id) {
      return undefined
    }

    const intervalId = window.setInterval(async () => {
      try {
        const data = await getCurrentSession(authToken)
        setSession(data.session)
        setAttendance(data.attendance ?? [])
      } catch (error) {
        if (error.status === 401) {
          setAuthToken('')
          setAuthError('Your session expired. Please log in again.')
          return
        }

        setSessionMessage(error.message)
      }
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [authToken, session?.session_id])

  async function handleLogin(credentials) {
    setAuthLoading(true)
    setAuthError('')

    try {
      const data = await loginTeacher(credentials)
      setAuthToken(data.access_token)
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleRegister(formData) {
    setAuthLoading(true)
    setAuthError('')

    try {
      await registerTeacher(formData)
      await handleLogin({
        email: formData.email,
        password: formData.password,
      })
    } catch (error) {
      setAuthError(error.message)
      setAuthLoading(false)
    }
  }

  async function handleStartSession() {
    if (!authToken) {
      setAuthError('Please log in first.')
      return
    }

    setSessionLoading(true)
    setSessionMessage('')

    try {
      const data = await startSessionRequest(authToken)
      setSession({
        session_id: data.session_id,
        status: data.status,
        start_time: data.start_time ?? session?.start_time ?? null,
      })
      setAttendance(data.attendance ?? [])
      setSessionMessage(data.message || 'Session started.')
      setPage('attendance')
    } catch (error) {
      if (error.status === 401) {
        setAuthToken('')
        setAuthError('Your session expired. Please log in again.')
      } else {
        setSessionMessage(error.message)
      }
    } finally {
      setSessionLoading(false)
    }
  }

  async function handleEndSession() {
    if (!authToken) {
      return
    }

    setSessionLoading(true)
    setSessionMessage('')

    try {
      const data = await endSessionRequest(authToken)
      setSession(null)
      setAttendance([])
      setSessionMessage(data.message || 'Session ended.')
      setPage('dashboard')
    } catch (error) {
      if (error.status === 401) {
        setAuthToken('')
        setAuthError('Your session expired. Please log in again.')
      } else {
        setSessionMessage(error.message)
      }
    } finally {
      setSessionLoading(false)
    }
  }

  function handleLogout() {
    setAuthToken('')
    setAuthError('')
    setSession(null)
    setAttendance([])
    setSessionMessage('')
    setPage('dashboard')
  }

  if (!authToken) {
    return (
      <Login
        authError={authError}
        authLoading={authLoading}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    )
  }

  return (
    <>
      <Sidebar page={page} setPage={setPage} onLogout={handleLogout} />
      <main className="main">
        {page === 'dashboard' && (
          <Dashboard
            session={session}
            sessionLoading={sessionLoading}
            sessionMessage={sessionMessage}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
          />
        )}
        {page === 'attendance' && (
          <Attendance
            attendance={attendance}
            session={session}
            sessionLoading={sessionLoading}
            sessionMessage={sessionMessage}
            setPage={setPage}
            setAttendance={setAttendance}
          />
        )}

        
      
      </main>
    </>
  )
}

export default App
