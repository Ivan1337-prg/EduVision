import React, {useState} from "react"
import pictr from "./assets/Eduvisionlogo.png"

function Sidebar({setPage}){
  return(
    
    <div className="sidebar">
        <h1>
        <img className = "logo" src={pictr}></img>
    </h1>
      <h2>Navigation</h2>
      <div className="sidebar-button">
      <button onClick={() => setPage("dashboard")} className="sidebar-button">Dashboard</button>
      <button onClick={() => setPage("attendance")} className="sidebar-button">Attendance</button>
      <button className="sidebar-button"> Logs </button>
        <button className="sidebar-button">Settings</button>
        </div>
    </div>
  );
}

export default Sidebar;