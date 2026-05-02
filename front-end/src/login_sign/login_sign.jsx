import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './login_sign.css'

const API = "http://localhost:5001/api";

const LoginSign = () => {

    const [action, setAction] = useState("Sign Up");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Login failed.");
                return;
            }

            // Store logged-in user info in sessionStorage so other pages can read it
            sessionStorage.setItem("token", data.token);
            sessionStorage.setItem("user", JSON.stringify({ role: data.role, name: data.name }));
            
            alert(`${data.role === "admin" ? "Admin" : "User"} Login Successful!`);

            if (data.role === "admin") {
                navigate("/admin_home_temp");
            } else {
                navigate("/user_home_temp");
            }
        } catch (err) {
            alert("Could not reach the server. Make sure the backend is running on port 5001.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Registration failed.");
                return;
            }

            alert("Registration successful! Please log in.");
            setAction("Login");
            setName("");
            setEmail("");
            setPassword("");
        } catch (err) {
            alert("Could not reach the server. Make sure the backend is running on port 5001.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-sign-background">

        <navbar className="navbar">
            <span>QueueSmart</span>
        </navbar>

        <div className="login-sign-container">
            <div className="header">
                <div className="text">{action}
                    <div className="underline"></div>
                </div>
            </div>
            
            <div className="inputs">

                {action === "Login" ? null : (
                    <div className="input">
                        <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                )}

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
                <div
                    className={action === "Login" ? "submit gray" : "submit"}
                    onClick={() => {
                        if (action === "Sign Up") {
                            handleSignUp();
                        } else {
                            setAction("Sign Up");
                        }
                    }}
                >
                    {loading && action === "Sign Up" ? "..." : "Sign Up"}
                </div>

                <div
                    className={action === "Sign Up" ? "submit gray" : "submit"}
                    onClick={() => {
                        if (action === "Login") {
                            handleLogin();
                        } else {
                            setAction("Login");
                        }
                    }}
                >
                    {loading && action === "Login" ? "..." : "Log-In"}
                </div>
            </div>

            {action === "Sign Up" ? null : (
                <div className="forgot-password">Lost your Password?</div>
            )}
        </div>
        </div>
    )
}

export default LoginSign
