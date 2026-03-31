import React, {useState} from 'react'
import './App.css'
import Dashboard from './pages/Dashboard.jsx'
import Attendance from './pages/Attendance.jsx'
import Sidebar from './components/Sidebar.jsx'
import Login from './pages/Login.jsx'


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

