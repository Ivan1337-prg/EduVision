import pictr from "./assets/Eduvisionlogo.png"
function Login({setLogin}){
    return(
        <>
        <h1>
            <img className= "LoginImage" src ={pictr}/>
           
        </h1>
        <h2 className = "Logindetail">
            Please Log in
        </h2>
        <p className = "Logindetail2">
            <input className = "email" placeholder = "Email">
        </input>
        
        </p>
        <h3 className = "Logindetail2">
            <input className = "Password" placeholder = "Password">
        </input>
        </h3>
        <h4 className = "Logindetail2">
            <button className = "Login-button" onClick={() => setLogin(true)}>
            Login
        </button>
        </h4>
        
        </>
    );
}

export default Login