function formatTimestamp(value) {
  if (!value) return 'Not checked in'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function AttendanceTable({ students, mode, setAttendance, emptyMessage }) {
  function updateStatus(id, status) {
    setAttendance(previous => previous.map(student => student.attendance_id === id ? { ...student, status } : student))
  }

  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label="Attendance records">
      <table className="attendanceTable">
        <thead><tr><th scope="col">Student name</th><th scope="col">Student ID</th><th scope="col">Status</th><th scope="col">First check-in</th><th scope="col">15 min confirm</th><th scope="col">Face verified</th></tr></thead>
        <tbody>
          {students.length === 0 && <tr><td colSpan={6} className="empty-state"><span className="empty-state-symbol" aria-hidden="true">◎</span><strong>No attendance to show yet</strong><p>{emptyMessage}</p></td></tr>}
          {students.map(student => (
            <tr key={student.attendance_id}>
              <td><span className="student-cell"><span className="student-avatar" aria-hidden="true">{student.student_name?.slice(0, 1)}</span>{student.student_name}</span></td>
              <td className="student-code">{student.student_code}</td>
              <td>{mode === 'manage' ? (
                <select className="status-select" aria-label={`Attendance status for ${student.student_name}`} value={student.status}
                  onChange={event => updateStatus(student.attendance_id, event.target.value)}>
                  {!['present', 'absent'].includes(student.status) && <option value={student.status}>{student.status}</option>}
                  <option value="present">Present</option><option value="absent">Absent</option>
                </select>
              ) : <span className={`status-pill ${['confirmed', 'present'].includes(student.status) ? 'status-present' : 'status-absent'}`}>{student.status}</span>}</td>
              <td>{formatTimestamp(student.first_check_in)}</td><td>{formatTimestamp(student.fifteen_min_confirm)}</td>
              <td><span className={`badge ${student.first_check_in ? 'badge-yes' : 'badge-no'}`}>{student.first_check_in ? 'Verified' : 'Waiting'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
export default AttendanceTable
