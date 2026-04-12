import Session from '../utils/Session.jsx'

function Dashboard({ onEndSession, onStartSession, session, sessionLoading, sessionMessage }) {
  return (
    <>
      <h1>Dashboard</h1>

      <div className="class-info">
        <h3 className="class-name">CSCE 4901 - Software Engineering Capstone</h3>
        <p className="class-copy">Start a session to generate a live `session_id` students can use for face verification.</p>
      </div>

      <Session
        session={session}
        sessionLoading={sessionLoading}
        sessionMessage={sessionMessage}
        onEndSession={onEndSession}
        onStartSession={onStartSession}
      />
    </>
  )
}

export default Dashboard
