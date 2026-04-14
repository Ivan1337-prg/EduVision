import pictr from './assets/Eduvisionlogo.png'

function Sidebar({ onLogout, page, setPage }) {
  return (
    <div className="sidebar">
      <img className="logo" src={pictr} alt="EduVision" />
      <h2>Navigation</h2>
      <div className="sidebar-button">
        <button
          onClick={() => setPage('dashboard')}
          className={page === 'dashboard' ? 'nav-active' : ''}
          type="button"
        >
          Dashboard
        </button>
        <button
          onClick={() => setPage('attendance')}
          className={page === 'attendance'  ? 'nav-active' : ''}
          type="button"
        >
          Attendance
        </button>
        <button onClick={onLogout} type="button">Logout</button>
      </div>
    </div>
  )
}

export default Sidebar
