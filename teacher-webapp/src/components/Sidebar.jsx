import React, {useState} from "react"


function Sidebar({setPage}){
  return(
    
    <div className="sidebar">
        <h1>
       
    </h1>
      <h2>Sidebar</h2>
      <button onClick={() => setPage("dashboard")}>Dashboard</button>
      <button onClick={() => setPage("attendance")}>Attendance</button>
        <button>settings</button>
    </div>
  );
}

export default Sidebar;