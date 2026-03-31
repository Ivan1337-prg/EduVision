import React, {useState} from "react"
import pictr from "./assets/Eduvisionlogo.png"

function Sidebar({setPage}){
  return(
    
    <div className="sidebar">
        <h1>
        <img className = "logo" src={pictr}></img>
    </h1>
      <h2>Sidebar</h2>
      <button onClick={() => setPage("dashboard")}>Dashboard</button>
      <button onClick={() => setPage("attendance")}>Attendance</button>
        <button>settings</button>
    </div>
  );
}

export default Sidebar;