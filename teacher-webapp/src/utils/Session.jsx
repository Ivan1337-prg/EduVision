function Session({ onEndSession, onStartSession, session, sessionLoading, sessionMessage }) {
  const sessionActive = Boolean(session?.session_id)

  return (
    <section className="card session-card">
      <h2 className="currentSession">Current Session: {sessionActive ? 'Active' : 'Inactive'}</h2>
      <p><strong>Session ID:</strong> {session?.session_id ?? 'Not started yet'}</p>
      <p><strong>Status:</strong> {session?.status ?? 'inactive'}</p>
      <p><strong>Started At:</strong> {session?.start_time ?? 'N/A'}</p>
      {sessionMessage ? <p className="session-message">{sessionMessage}</p> : null}

      <div className="session-actions">
        <button className="Status-button" disabled={sessionLoading || sessionActive} onClick={onStartSession}>
          {sessionLoading && !sessionActive ? 'Starting...' : 'Start Session'}
        </button>
        <button className="Status-button muted" disabled={sessionLoading || !sessionActive} onClick={onEndSession}>
          {sessionLoading && sessionActive ? 'Ending...' : 'End Session'}
        </button>
      </div>
    </section>
  )
}

export default Session
