import React, { useMemo, useState, useEffect, useCallback } from "react";
import "./user_home_temp.css";

const API = "http://localhost:5000/api";
const token = () => sessionStorage.getItem("token");
const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
});

const UserHome = () => {
    // Gets the logged-in user from sessionStorage (set by the login page)
    const loggedInUser = JSON.parse(sessionStorage.getItem("user") || "null");
    const userId = loggedInUser?.id || 2;
    const userName = loggedInUser?.name || "Test User";

    const [notification, setNotification] = useState(null);
    const notify = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 2500);
    };

    // Nav tab
    const [page, setPage] = useState("dashboard");

    // DATA FROM BACKEND
    const [services, setServices] = useState([]);
    const [currentQueue, setCurrentQueue] = useState({ inQueue: false });
    const [history, setHistory] = useState([]);
    const [backendNotifs, setBackendNotifs] = useState([]);

    // Join Queue
    const [selectedServiceId, setSelectedServiceId] = useState("");

    // Fetches all services
    const fetchServices = useCallback(async () => {
        try {
            const res = await fetch(`${API}/services`, { headers: authHeaders() });
            setServices(await res.json());
        } catch {
            notify("Error loading services.");
        }
    }, []);

    // Fetch the user's current queue status
    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch(`${API}/queue/status/${userId}`, { headers: authHeaders() });
            const data = await res.json();
            setCurrentQueue(data);
        } catch {
            notify("Error loading queue status.");
        }
    }, [userId]);

    // Fetch user history
    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch(`${API}/history/${userId}`, { headers: authHeaders() });
            setHistory(await res.json());
        } catch {
            notify("Error loading history.");
        }
    }, [userId]);

    // Fetch backend notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch(`${API}/notifications/${userId}`, { headers: authHeaders() });
            setBackendNotifs(await res.json());
        } catch {
            // silently ignore – notifications are non-critical
        }
    }, [userId]);

    // Load everything on mount
    useEffect(() => {
        fetchServices();
        fetchStatus();
        fetchHistory();
        fetchNotifications();
    }, [fetchServices, fetchStatus, fetchHistory, fetchNotifications]);

    // Derived values
    const activeServices = useMemo(() => services.filter((s) => s.is_open), [services]);

    const selectedService = useMemo(() => {
        const idNum = Number(selectedServiceId);
        return services.find((s) => s.id === idNum) || null;
    }, [selectedServiceId, services]);

    // Join a queue
    const handleJoinQueue = async () => {
        if (!selectedService) { notify("Please select a service."); return; }
        if (!selectedService.is_open) { notify("This service is currently closed."); return; }
        if (currentQueue.inQueue) { notify("You are already in a queue. Leave first."); return; }

        try {
            const res = await fetch(`${API}/queue/join`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ serviceId: selectedService.id }),
            });
            const data = await res.json();
            if (!res.ok) { notify(data.error); return; }

            notify(`Joined ${selectedService.name} queue. You are #${data.position}.`);
            await fetchStatus();
            await fetchServices();
            await fetchNotifications();
            setPage("status");
        } catch {
            notify("Error joining queue.");
        }
    };

    // Leave queue
    const handleLeaveQueue = async () => {
        if (!currentQueue.inQueue) { notify("You are not in a queue."); return; }

        try {
            const res = await fetch(`${API}/queue/leave`, {
                method: "POST",
                headers: authHeaders(),
            });
            const data = await res.json();
            if (!res.ok) { notify(data.error); return; }

            notify("Left the queue.");
            await fetchStatus();
            await fetchServices();
            await fetchHistory();
        } catch {
            notify("Error leaving queue.");
        }
    };

    // Mark all notifications read
    const handleMarkAllRead = async () => {
        try {
            await fetch(`${API}/notifications/user/${userId}/read-all`, { method: "PATCH" });
            fetchNotifications();
        } catch { /* ignore */ }
    };

    const unreadCount = backendNotifs.filter((n) => !n["Is Read"]).length;

    return (
        <div className="user-home-background">
            <div className="login-sign-container">
                <div className="header">
                    User Portal
                    <div className="underline"></div>
                </div>

                {notification && (
                    <div className="login-sign-container">{notification}</div>
                )}

                {/* Navigation Tabs */}
                <div className="submit-box">
                    <button className="submit" onClick={() => { setPage("dashboard"); fetchServices(); fetchStatus(); }}>
                        Dashboard
                    </button>
                    <button className="submit" onClick={() => { setPage("join"); fetchServices(); }}>
                        Join Queue
                    </button>
                    <button className="submit" onClick={() => { setPage("status"); fetchStatus(); }}>
                        Queue Status
                    </button>
                    <button className="submit" onClick={() => { setPage("history"); fetchHistory(); }}>
                        History
                    </button>
                </div>

                {/* Dashboard */}
                {page === "dashboard" && (
                    <div>
                        <h2>Overview</h2>

                        <div className="card">
                            <h3>Current Queue Status</h3>
                            {!currentQueue.inQueue ? (
                                <p>You are not currently in a queue.</p>
                            ) : (
                                <>
                                    <p>Service: <b>{currentQueue.service_name}</b></p>
                                    <p>Position: <b>{currentQueue.position}</b></p>
                                    <p>Estimated Wait: <b>{currentQueue.estimated_wait} minutes</b></p>
                                    <p>Status: <b>{currentQueue.status}</b></p>
                                    <button onClick={handleLeaveQueue}>Leave Queue</button>
                                </>
                            )}
                        </div>

                        <div className="card">
                            <h3>Active Services Available</h3>
                            {activeServices.length === 0 ? (
                                <p>No services are currently open.</p>
                            ) : (
                                activeServices.map((s) => (
                                    <div key={s.id} style={{ marginBottom: "10px" }}>
                                        <b>{s.name}</b> — {s.description}
                                        <div>Expected Duration: {s.expected_duration} min</div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="card">
                            <h3>Notifications {unreadCount > 0 && <span>({unreadCount} unread)</span>}</h3>
                            {backendNotifs.length === 0 ? (
                                <p>No notifications.</p>
                            ) : (
                                <>
                                    {backendNotifs.slice(0, 3).map((n) => (
                                        <p key={n.id} style={{ fontWeight: n["Is Read"] ? "normal" : "bold" }}>
                                            {n.Message}
                                        </p>
                                    ))}
                                    {unreadCount > 0 && (
                                        <button onClick={handleMarkAllRead}>Mark All Read</button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Join a queue */}
                {page === "join" && (
                    <div>
                        <h2>Join a Queue</h2>
                        <div className="card">
                            <label>
                                Select a Service (required):
                                <select
                                    value={selectedServiceId}
                                    onChange={(e) => setSelectedServiceId(e.target.value)}
                                    style={{ display: "block", marginTop: "8px" }}
                                >
                                    <option value="">-- Select service --</option>
                                    {services.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.is_open ? "Open" : "Closed"})
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {selectedService && (
                                <div style={{ marginTop: "12px" }}>
                                    <h3>{selectedService.name}</h3>
                                    <p>{selectedService.description}</p>
                                    <p>Expected Duration: <b>{selectedService.expected_duration} min</b></p>
                                </div>
                            )}

                            <div className="submit-box" style={{ marginTop: "12px" }}>
                                {!currentQueue.inQueue ? (
                                    <button className="submit" onClick={handleJoinQueue}>Join Queue</button>
                                ) : (
                                    <button className="submit" onClick={handleLeaveQueue}>Leave Current Queue</button>
                                )}
                            </div>

                            {currentQueue.inQueue && (
                                <p style={{ marginTop: "10px" }}>
                                    You are currently in <b>{currentQueue.serviceName}</b>. Go to <b>Queue Status</b>.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Queue Status */}
                {page === "status" && (
                    <div>
                        <h2>Queue Status</h2>
                        {!currentQueue.inQueue ? (
                            <div className="card">
                                <p>You are not currently in a queue.</p>
                                <button onClick={() => setPage("join")}>Go Join a Queue</button>
                            </div>
                        ) : (
                            <div className="card">
                                <p>Service: <b>{currentQueue.service_name}</b></p>
                                <p>Current Position: <b>{currentQueue.position}</b></p>
                                <p>Estimated Wait Time: <b>{currentQueue.estimated_wait} minutes</b></p>
                                <p>Status: <b>{currentQueue.status}</b></p>
                                <p style={{ color: "#888", fontSize: "0.85em" }}>
                                    Status updates in real deployments: your position updates automatically
                                    when the admin serves users ahead of you.
                                </p>
                                <button onClick={handleLeaveQueue} style={{ marginTop: "12px" }}>
                                    Leave Queue
                                </button>
                                <button onClick={fetchStatus} style={{ marginTop: "8px", marginLeft: "8px" }}>
                                    Refresh
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* History */}
                {page === "history" && (
                    <div>
                        <h2>History</h2>
                        <div className="card">
                            {history.length === 0 ? (
                                <p>No history yet.</p>
                            ) : (
                                history.map((h) => (
                                    <div key={h.id} style={{ marginBottom: "12px" }}>
                                        <div><b>{h.service_name}</b></div>
                                        <div>Date: {h.date}</div>
                                        <div>Outcome: {h.Outcome}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserHome;
