function formatTimestamp(value) {
  if (!value) {
    return 'Not checked in'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

function statusClassName(status) {
  if (status === 'confirmed' || status === 'present') {
    return 'status-present'
  }

  return 'status-absent'
}

function AttendanceTable({ students }) {
  return (
    <table className="attendanceTable">
      <thead>
        <tr>
          <th>Name</th>
          <th>Student Number</th>
          <th>Status</th>
          <th>First Check-In</th>
          <th>15 Min Confirm</th>
          <th>Face Verified</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr key={student.attendance_id}>
            <td>{student.student_name}</td>
            <td>{student.student_code}</td>
            <td className={statusClassName(student.status)}>{student.status}</td>
            <td>{formatTimestamp(student.first_check_in)}</td>
            <td>{formatTimestamp(student.fifteen_min_confirm)}</td>
            <td>
              <span className={`badge ${student.first_check_in ? 'badge-yes' : 'badge-no'}`}>
                {student.first_check_in ? 'Verified' : 'Waiting'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default AttendanceTable
