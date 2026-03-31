import React from 'react';
import AttendanceTable from '../utils/AttendanceTable.jsx';
import Cards from '../components/cards.jsx'
function Attendance(){
    return(
        <div>
            <h1>Attendance
                
            </h1>
            
                <Cards text = "Total Students" num = {45}/>
                <Cards text = "Present Today" num = {45}/>
                <Cards text = "Late" num = {45}/>
                <Cards text = "Absent" num = {45}/>
            <input
            className = "search"
            placeholder = "Search by Student Name or ID"
            />
            <AttendanceTable />
        </div>
    );
}

export default Attendance;