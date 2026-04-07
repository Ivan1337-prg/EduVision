
import Session from '../utils/Session.jsx'

function Dashboard(){
    return(
        <>
            <h1>Dashboard</h1>

            <div className="class-info">
                <h3 className="class-name">CSCE 4901 - Software Engineering Capstone (Tue/Thu 9:30 AM)</h3>
            </div>
            <Session/>
        </>
    );
}

export default Dashboard;