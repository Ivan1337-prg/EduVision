import React,{useState} from 'react';


function Session(){
    const [sessionStatus, setStatus] = useState(false);

    return(
        <>
        <h1 className = "currentSession">Current Session: {sessionStatus ? "Active" : "Inactive"} </h1>
        <button className = "Status-button" onClick = {() =>setStatus(true)}>
            Start Session
        </button>
        <button className = "Status-button" onClick = {() =>setStatus(false)}>
            End Session
        </button>
        {sessionStatus}
        </>
    );

}


export default Session;