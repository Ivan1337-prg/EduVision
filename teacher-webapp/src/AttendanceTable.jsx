import React from 'react';

const students = [
      {name: "Taron", id: "001", status: "Present", time: "9:35 AM", face: "Yes", location: "Yes"},
  {name: "Jacob", id: "002", status: "Absent", time: "", face: "", location: ""}
]
function AttendanceTable(){
    return(
        <table className="attendanceTable">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>ID</th>
                    <th>Status</th>
                    <th>Check-in TIme</th>
                    <th>Face Verified</th>
                    <th>Location Verified</th>

                </tr>
            </thead>
            <tbody>
                {students.map((s, index) => (<tr key = {index}>
                    <td>{s.name}</td>
                    <td>{s.id}</td>
                    <td>{s.status}</td>
                    <td>{s.time}</td>
                    <td>{s.face}</td>
                    <td>{s.location}</td>
                </tr>))}
            </tbody>
        </table>
    );

}

export default AttendanceTable;