import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import "./user_home_temp.css";

const API = "http://localhost:5000/api";
const token = () => sessionStorage.getItem("token");
const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
});

const UserHome = () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem("user") || "null");
    const userName     = loggedInUser?.name || "User";

    // Decode user id from JWT
    const userId = useMemo(() => {
        try { return JSON.parse(atob(token().split(".")[1])).id; }
        catch { return 2; }
    }, []);

    const [toast, setToast]               = useState(null);
    const [page, setPage]                 = useState("dashboard");
    const [services, setServices]         = useState([]);
    const [currentQueue, setCurrentQueue] = useState({ inQueue: false });
    const [history, setHistory]           = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState("");
    const [recommendation, setRecommendation]       = useState(null);
    const [bestTime, setBestTime]                   = useState(null);
    const [joining, setJoining]                     = useState(false);
    const [leaving, setLeaving]                     = useState(false);
    const pollRef = useRef(null);

    const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const fetchServices = useCallback(async () => {
        try {
            const res  = await fetch(`${API}/services`, { headers: authHeaders() });
            const data = await res.json();
            if (res.ok) setServices(data);
        } catch {}
    }, []);

    const fetchStatus = useCallback(async () => {
        try {
            const res  = await fetch(`${API}/queue/status/${userId}`, { headers: authHeaders() });
            const data = await res.json();
            if (res.ok) setCurrentQueue(data);
        } catch {}
    }, [userId]);

    const fetchHistory = useCallback(async () => {
        try {
            const res  = await fetch(`${API}/history/${userId}`, { headers: authHeaders() });
            const data = await res.json();
            if (res.ok) setHistory(data);
        } catch {}
    }, [userId]);

    const fetchNotifications = useCallback(async () => {
        try {
            const res  = await fetch(`${API}/notifications/${userId}`, { headers: authHeaders() });
            const data = await res.json();
            if (res.ok) setNotifications(data);
        } catch {}
    }, [userId]);

    const fetchRecommendation = useCallback(async (serviceId) => {
        if (!serviceId) { setRecommendation(null); setBestTime(null); return; }
        try {
            const [r1, r2] = await Promise.all([
                fetch(`${API}/smart/recommend/${serviceId}`, { headers: authHeaders() }),
                fetch(`${API}/smart/best-time/${serviceId}`, { headers: authHeaders() }),
            ]);
            if (r1.ok) setRecommendation(await r1.json());
            if (r2.ok) setBestTime(await r2.json());
        } catch {}
    }, []);

    // Initial load + auto-refresh every 5 seconds
    useEffect(() => {
        fetchServices(); fetchStatus(); fetchHistory(); fetchNotifications();
        pollRef.current = setInterval(() => {
            fetchServices();
            fetchStatus();
        }, 5000);
        return () => clearInterval(pollRef.current);
    }, [fetchServices, fetchStatus, fetchHistory, fetchNotifications]);

    useEffect(() => { fetchRecommendation(selectedServiceId); }, [selectedServiceId, fetchRecommendation]);

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "/";
    };

    const handleJoinQueue = async () => {
        const svc = services.find(s => s.id === Number(selectedServiceId));
        if (!svc)           return notify("Please select a service.");
        if (!svc.is_open)   return notify("This service is currently closed.");
        if (currentQueue.inQueue) return notify("You are already in a queue. Leave it first.");

        setJoining(true);
        try {
            const res  = await fetch(`${API}/queue/join`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ serviceId: svc.id }),
            });
            const data = await res.json();
            if (!res.ok) return notify(data.error);
            notify(`✓ Joined ${svc.name}! You are #${data.position}`);
            await fetchStatus();
            await fetchServices();
            await fetchNotifications();
            setPage("status");
        } catch { notify("Error joining queue."); }
        finally { setJoining(false); }
    };

    const handleLeaveQueue = async () => {
        if (!currentQueue.inQueue) return notify("You are not in a queue.");
        setLeaving(true);
        try {
            const res  = await fetch(`${API}/queue/leave`, { method: "POST", headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) return notify(data.error);
            notify("You have left the queue.");
            await fetchStatus();
            await fetchServices();
            await fetchHistory();
        } catch { notify("Error leaving queue."); }
        finally { setLeaving(false); }
    };

    const activeServices = useMemo(() => services.filter(s => s.is_open), [services]);
    const unreadCount    = notifications.filter(n => !n["Is Read"]).length;
    const selectedService = useMemo(() => services.find(s => s.id === Number(selectedServiceId)) || null, [selectedServiceId, services]);

    const navItems = [
        { key: "dashboard", label: "Dashboard" },
        { key: "join",      label: "Join Queue" },
        { key: "status",    label: currentQueue.inQueue ? `Queue Status • #${currentQueue.position}` : "Queue Status" },
        { key: "history",   label: "History" },
    ];

    return (
        <div className="theme-light user-layout" style={{ width: "100%" }}>
            {/* Topbar */}
            <header className="user-topbar">
                <div className="topbar-logo">Queue<span>Smart</span></div>
                <div className="topbar-right">
                    <span className="user-badge">👤 {userName}</span>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            {/* Nav tabs */}
            <nav className="user-nav">
                {navItems.map(item => (
                    <button
                        key={item.key}
                        className={`user-nav-item ${page === item.key ? "active" : ""}`}
                        onClick={() => {
                            setPage(item.key);
                            if (item.key === "status")    fetchStatus();
                            if (item.key === "history")   fetchHistory();
                            if (item.key === "dashboard") { fetchServices(); fetchStatus(); fetchNotifications(); }
                            if (item.key === "join")      fetchServices();
                        }}
                    >
                        {item.label}
                        {item.key === "dashboard" && unreadCount > 0 && (
                            <span style={{ marginLeft: "6px", background: "var(--accent)", color: "white", borderRadius: "10px", padding: "1px 6px", fontSize: "0.7rem" }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {toast && <div className="toast">{toast}</div>}

            <div className="user-content">

                {/* ── DASHBOARD ── */}
                {page === "dashboard" && (
                    <div>
                        <h2 className="page-title">Overview</h2>

                        {/* Queue banner */}
                        {currentQueue.inQueue ? (
                            <div className="queue-banner">
                                <div className="queue-info">
                                    <h3>Currently in queue</h3>
                                    <div className="queue-service">{currentQueue.service_name}</div>
                                </div>
                                <div className="queue-stats">
                                    <div className="stat-item">
                                        <div className="val">#{currentQueue.position}</div>
                                        <div className="lbl">Position</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="val">{currentQueue.estimated_wait}m</div>
                                        <div className="lbl">Est. Wait</div>
                                    </div>
                                </div>
                                <button className="btn btn-danger btn-sm" onClick={handleLeaveQueue} disabled={leaving}>
                                    {leaving ? "Leaving..." : "Leave Queue"}
                                </button>
                            </div>
                        ) : (
                            <div className="card" style={{ textAlign: "center", padding: "28px" }}>
                                <p style={{ color: "var(--muted)", marginBottom: "12px" }}>You are not currently in any queue.</p>
                                <button className="btn btn-primary btn-sm" onClick={() => setPage("join")}>
                                    Join a Queue →
                                </button>
                            </div>
                        )}

                        {/* Active services */}
                        <div className="card">
                            <h3>Open Services ({activeServices.length})</h3>
                            {activeServices.length === 0 ? (
                                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No services are currently open.</p>
                            ) : (
                                activeServices.map(s => (
                                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{s.name}</div>
                                            <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{s.description}</div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{Number(s.queue_length) || 0} waiting</div>
                                            <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{s.expected_duration} min avg</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Notifications */}
                        {notifications.length > 0 && (
                            <div className="card">
                                <h3>Recent Notifications {unreadCount > 0 && <span style={{ color: "var(--accent)", fontSize: "0.85rem" }}>({unreadCount} new)</span>}</h3>
                                {notifications.slice(0, 4).map(n => (
                                    <div key={n.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: "0.88rem", fontWeight: n["Is Read"] ? 400 : 600 }}>
                                        {n.Message}
                                        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "2px" }}>
                                            {new Date(n["Created/Sent"]).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── JOIN QUEUE ── */}
                {page === "join" && (
                    <div>
                        <h2 className="page-title">Join a Queue</h2>

                        {currentQueue.inQueue && (
                            <div style={{ background: "rgba(9,105,218,0.08)", border: "1px solid rgba(9,105,218,0.2)", borderRadius: "var(--radius)", padding: "12px 16px", marginBottom: "16px", fontSize: "0.9rem" }}>
                                ℹ You are currently in <b>{currentQueue.service_name}</b> (Position #{currentQueue.position}).
                                You must leave before joining another queue.
                                <button className="btn btn-danger btn-sm" style={{ marginLeft: "12px" }} onClick={handleLeaveQueue} disabled={leaving}>
                                    {leaving ? "..." : "Leave Queue"}
                                </button>
                            </div>
                        )}

                        <div className="card">
                            <div className="form-group">
                                <label>Select a Service</label>
                                <select
                                    className="service-select"
                                    value={selectedServiceId}
                                    onChange={e => setSelectedServiceId(e.target.value)}
                                    disabled={currentQueue.inQueue}
                                >
                                    <option value="">-- Choose a service --</option>
                                    {services.map(s => (
                                        <option key={s.id} value={s.id} disabled={!s.is_open}>
                                            {s.name} — {s.is_open ? `${Number(s.queue_length) || 0} waiting · ~${(Number(s.queue_length) + 1) * s.expected_duration}m wait` : "CLOSED"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Service details */}
                            {selectedService && (
                                <div className="service-detail-card">
                                    <div className="detail-item">
                                        <div className="lbl">Service</div>
                                        <div className="val">{selectedService.name}</div>
                                    </div>
                                    <div className="detail-item">
                                        <div className="lbl">Status</div>
                                        <div className="val">
                                            <span className={`badge ${selectedService.is_open ? "open" : "closed"}`}>
                                                {selectedService.is_open ? "Open" : "Closed"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <div className="lbl">People Waiting</div>
                                        <div className="val">{Number(selectedService.queue_length) || 0}
                                            {selectedService.max_capacity ? ` / ${selectedService.max_capacity}` : ""}
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <div className="lbl">Your Est. Wait</div>
                                        <div className="val" style={{ color: "var(--accent)" }}>
                                            ~{(Number(selectedService.queue_length) + 1) * selectedService.expected_duration} min
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Smart suggestion */}
                            {recommendation?.has_alternatives && (
                                <div className="smart-card yellow">
                                    <h4>💡 Shorter wait available</h4>
                                    <p style={{ fontSize: "0.85rem", marginBottom: "10px", color: "var(--text)" }}>
                                        Your selected service has ~{recommendation.selected_service.estimated_wait} min wait. Try one of these:
                                    </p>
                                    {recommendation.alternatives.map(alt => (
                                        <div key={alt.id} className="alt-service">
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{alt.name}</div>
                                                <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>~{alt.estimated_wait} min wait</div>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span className="save-tag">saves {alt.time_saved} min</span>
                                                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedServiceId(String(alt.id))}>
                                                    Switch
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {bestTime?.best_hours?.length > 0 && (
                                <div className="smart-card blue">
                                    <h4>🕐 Best time to join</h4>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text)" }}>{bestTime.suggestion}</p>
                                </div>
                            )}

                            <button
                                className="btn btn-primary btn-full"
                                onClick={handleJoinQueue}
                                disabled={joining || currentQueue.inQueue || !selectedServiceId || (selectedService && !selectedService.is_open)}
                                style={{ marginTop: "8px" }}
                            >
                                {joining ? "Joining..." : currentQueue.inQueue ? "Leave current queue first" : "Join Queue"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── QUEUE STATUS ── */}
                {page === "status" && (
                    <div>
                        <h2 className="page-title">Queue Status</h2>

                        {!currentQueue.inQueue ? (
                            <div className="card" style={{ textAlign: "center", padding: "32px" }}>
                                <p style={{ color: "var(--muted)", marginBottom: "16px" }}>You are not currently in any queue.</p>
                                <button className="btn btn-primary btn-sm" onClick={() => setPage("join")}>Join a Queue →</button>
                            </div>
                        ) : (
                            <div>
                                <div className="queue-banner">
                                    <div className="queue-info">
                                        <h3>You are in queue</h3>
                                        <div className="queue-service">{currentQueue.service_name}</div>
                                    </div>
                                    <div className="queue-stats">
                                        <div className="stat-item">
                                            <div className="val">#{currentQueue.position}</div>
                                            <div className="lbl">Position</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="val">{currentQueue.estimated_wait}m</div>
                                            <div className="lbl">Est. Wait</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "16px" }}>
                                        Your position updates automatically every 5 seconds. Click Refresh to update now.
                                    </p>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button className="btn btn-ghost" onClick={fetchStatus}>↻ Refresh</button>
                                        <button className="btn btn-danger" onClick={handleLeaveQueue} disabled={leaving}>
                                            {leaving ? "Leaving..." : "Leave Queue"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── HISTORY ── */}
                {page === "history" && (
                    <div>
                        <h2 className="page-title">Queue History</h2>
                        <div className="card">
                            {history.length === 0 ? (
                                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No history yet.</p>
                            ) : (
                                history.map(h => (
                                    <div key={h.id} className="history-item">
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{h.service_name}</div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                                                {new Date(h.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                            </div>
                                        </div>
                                        <span className={h.Outcome === "served" ? "outcome-served" : "outcome-left"}>
                                            {h.Outcome === "served" ? "✓ Served" : "↩ Left"}
                                        </span>
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