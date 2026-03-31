import React, {useState} from 'react'
import './App.css'
import Dashboard from './Dashboard.jsx'
import Attendance from './Attendance.jsx'
import Sidebar from './Sidebar.jsx'
import Login from './Login.jsx'


function App() {
  const [page, setPage] = useState("dashboard")
  const [isLoggedin, setLogin] = useState(false)
  if(isLoggedin){
    return(
      <>
      <Sidebar setPage = {setPage}/>
      <div className = "main">
        {page === "dashboard" && <Dashboard/>}
        {page === "attendance" && <Attendance/>}
      </div>
      </>
    );
  }
  else{
    return(
      <Login setLogin={setLogin}/>
       
    );
  }

}

export default App;

