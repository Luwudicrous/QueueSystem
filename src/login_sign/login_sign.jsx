import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './login_sign.css'


const LoginSign = () => {

    const [action,setAction] = useState("Sign Up");
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = () => {
        // Temporary Logins
        console.log("Logging in with:", { email, password });
        const admintestEmail = "admin@queuesmart.com"
        const admintestPassword = "admin123"

        const usertestEmail = "testuser@gmail.com"
        const usertestPassword = "test123"

        if (email === admintestEmail && password === admintestPassword) {
            alert("Admin Login Successful!");
            navigate("/admin_home_temp"); // Navigate to admin home page
        } else if (email === usertestEmail && password === usertestPassword) {
            alert("User Login Successful!");
            navigate("/user_home_temp"); // Navigate to user home page
        } else {
            alert("Invalid email or password. Please try again.");
        }
    }

    return (
        <div className="login-sign-background">

        <navbar className="navbar">
            <span>QueueSmart</span>
        </navbar>

        <div className="login-sign-container">
            <div className="header">
                <div className="text">{action}
                    <div className="underline">
                    </div>
                </div>
            </div>
            
            <div className="inputs">

                {action==="Login"?null:<div className="input"><input type="text" placeholder="Name" /></div>}

                <div className="input">
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="input">
                    <input 
                        type="password" 
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            <div className="submit-box">
                <div className={action==="Login"?"submit gray":"submit"} onClick={()=>{setAction("Sign Up")}}>Sign Up</div>
                <div className={action==="Sign Up"?"submit gray":"submit"} 
                    onClick={()=>{
                        if(action === "Login"){
                            handleLogin();
                        } else {
                            setAction("Login");
                        }
                    }}>
                        Log-In
                </div>
            </div>
            {action==="Sign Up"?null:
            <div className="forgot-password">Lost your Password?
            </div>
            }
        </div>
        </div>
    )
}


export default LoginSign