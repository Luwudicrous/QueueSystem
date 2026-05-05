import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './login_sign.css'

const API = "http://localhost:5001/api";

const LoginSign = () => {
    const [action, setAction]     = useState("Login");
    const [name, setName]         = useState("");
    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        setError("");
        if (!email.trim())    return setError("Email is required.");
        if (!password.trim()) return setError("Password is required.");
        setLoading(true);
        try {
            const res  = await fetch(`${API}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data.error || "Login failed.");

            sessionStorage.setItem("token", data.token);
            sessionStorage.setItem("user", JSON.stringify({ role: data.role, name: data.name }));

            if (data.role === "admin") navigate("/admin_home_temp");
            else navigate("/user_home_temp");
        } catch {
            setError("Could not reach the server. Make sure the backend is running on port 5000.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setError("");
        if (!name.trim())     return setError("Name is required.");
        if (!email.trim())    return setError("Email is required.");
        if (!password.trim()) return setError("Password is required.");
        if (password.length < 6) return setError("Password must be at least 6 characters.");
        setLoading(true);
        try {
            const res  = await fetch(`${API}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            if (!res.ok) return setError(data.error || "Registration failed.");
            setAction("Login");
            setName(""); setEmail(""); setPassword("");
            setError("");
        } catch {
            setError("Could not reach the server.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") action === "Login" ? handleLogin() : handleSignUp();
    };

    return (
        <div className="login-sign-background">
            <navbar className="navbar"><span>QueueSmart</span></navbar>

            <div className="login-sign-container">
                <div className="header">
                    <div className="text">
                        {action === "Login" ? "Welcome back" : "Create account"}
                        <div className="underline"></div>
                    </div>
                </div>

                {error && <div className="error-msg">{error}</div>}

                <div className="inputs">
                    {action === "Sign Up" && (
                        <div className="input">
                            <input type="text" placeholder="Full Name" value={name}
                                onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} />
                        </div>
                    )}
                    <div className="input">
                        <input type="email" placeholder="Email address" value={email}
                            onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown} />
                    </div>
                    <div className="input">
                        <input type="password" placeholder="Password" value={password}
                            onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} />
                    </div>
                </div>

                <div className="submit-box">
                    <div
                        className={action === "Login" ? "submit" : "submit gray"}
                        onClick={() => { if (action === "Login") handleLogin(); else { setAction("Login"); setError(""); } }}
                    >
                        {loading && action === "Login" ? "..." : "Log In"}
                    </div>
                    <div
                        className={action === "Sign Up" ? "submit" : "submit gray"}
                        onClick={() => { if (action === "Sign Up") handleSignUp(); else { setAction("Sign Up"); setError(""); } }}
                    >
                        {loading && action === "Sign Up" ? "..." : "Sign Up"}
                    </div>
                </div>

                {action === "Login" && (
                    <div className="forgot-password">Forgot your password?</div>
                )}
            </div>
        </div>
    );
};

export default LoginSign;