import pictr from './assets/Eduvisionlogo.png'

function Sidebar({ onLogout, page, setPage }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><img className="logo" src={pictr} alt="EduVision" /><span>Teacher workspace</span></div>
      <p className="nav-label">Workspace</p>
      <nav className="sidebar-button" aria-label="Main navigation">
        <button onClick={() => setPage('dashboard')} aria-current={page === 'dashboard' ? 'page' : undefined}
          className={page === 'dashboard' ? 'nav-active' : ''} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          Dashboard
        </button>
        <button onClick={() => setPage('attendance')} aria-current={page === 'attendance' ? 'page' : undefined}
          className={page === 'attendance' ? 'nav-active' : ''} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2v4m8-4v4M4 10h16m-12 5 2 2 5-4"/></svg>
          Attendance
        </button>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note"><span className="eyebrow">More time to teach</span><p>Your classroom.<br />All in one place.</p></div>
        <button className="logout-button" onClick={onLogout} type="button">Log out <span aria-hidden="true">↗</span></button>
      </div>
    </aside>
  )
}
export default Sidebar
