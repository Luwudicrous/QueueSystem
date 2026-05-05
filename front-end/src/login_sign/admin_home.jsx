import React, { useState, useEffect, useCallback, useRef } from 'react'
import './admin_home.css'
import ReportsPage from './ReportsPage'

const API = "http://localhost:5001/api";
const token = () => sessionStorage.getItem("token");
const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
});

const PAGE_TITLES = {
    dashboard: "Dashboard",
    services:  "Services",
    queue:     "Queue Manager",
    reports:   "Reports",
};

const AdminHome = () => {
    const [page, setPage]         = useState("dashboard");
    const [toast, setToast]       = useState(null);
    const [services, setServices] = useState([]);
    const [queues, setQueues]     = useState({});
    const [selectedId, setSelectedId] = useState(null);
    const pollRef = useRef(null);

    const notify = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const fetchServices = useCallback(async () => {
        try {
            const res  = await fetch(`${API}/services`, { headers: authHeaders() });
            const data = await res.json();
            if (res.ok) setServices(data);
        } catch {}
    }, []);

    const fetchQueue = useCallback(async (serviceId) => {
        if (!serviceId) return;
        try {
            const res  = await fetch(`${API}/queue/${serviceId}`, { headers: authHeaders() });
            const data = await res.json();
            if (res.ok) setQueues(prev => ({ ...prev, [serviceId]: data }));
        } catch {}
    }, []);

    // Auto-refresh every 5 seconds
    useEffect(() => {
        fetchServices();
        pollRef.current = setInterval(() => {
            fetchServices();
            if (selectedId) fetchQueue(selectedId);
        }, 5000);
        return () => clearInterval(pollRef.current);
    }, [fetchServices, fetchQueue, selectedId]);

    useEffect(() => {
        if (selectedId) fetchQueue(selectedId);
    }, [selectedId, fetchQueue]);

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "/";
    };

    const toggleQueue = async (id) => {
        try {
            const res     = await fetch(`${API}/services/${id}/toggle`, { method: "PATCH", headers: authHeaders() });
            const updated = await res.json();
            if (!res.ok) return notify(updated.error);
            setServices(prev => prev.map(s => s.id === id ? updated : s));
            notify(`Queue ${updated.is_open ? "opened" : "closed"} for ${updated.name}`);
        } catch { notify("Error toggling queue."); }
    };

    const serveNext = async () => {
        if (!selectedId) return;
        try {
            const res  = await fetch(`${API}/queue/${selectedId}/serve-next`, { method: "POST", headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) return notify(data.error);
            notify(data.message);
            fetchQueue(selectedId);
            fetchServices();
        } catch { notify("Error serving next user."); }
    };

    const selectedQueue    = queues[selectedId] || [];
    const selectedService  = services.find(s => s.id === selectedId);
    const totalWaiting     = services.reduce((acc, s) => acc + (Number(s.queue_length) || 0), 0);
    const openServices     = services.filter(s => s.is_open).length;

    return (
        <div className="theme-dark admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="sidebar-logo">
                    <span>QueueSmart <span className="role-badge">Admin</span></span>
                </div>
                <nav className="sidebar-nav">
                    {["dashboard","services","queue","reports"].map(p => (
                        <button
                            key={p}
                            className={`nav-item ${page === p ? "active" : ""}`}
                            onClick={() => { setPage(p); if (p === "dashboard" || p === "services") fetchServices(); }}
                        >
                            <span className="nav-icon">
                                {p === "dashboard" && "⊞"}
                                {p === "services"  && "⚙"}
                                {p === "queue"     && "☰"}
                                {p === "reports"   && "⎙"}
                            </span>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <span>↩</span> Logout
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="admin-main">
                <div className="admin-topbar">
                    <h1>{PAGE_TITLES[page]}</h1>
                </div>

                <div className="admin-content">
                    {toast && <div className="toast">{toast}</div>}

                    {/* ── DASHBOARD ── */}
                    {page === "dashboard" && (
                        <div>
                            <div className="stat-grid" style={{ marginTop: "5%" }}>
                                <div className="stat-card">
                                    <div className="stat-label">Total Services</div>
                                    <div className="stat-value">{services.length}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Open Services</div>
                                    <div className="stat-value">{openServices}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Currently Waiting</div>
                                    <div className="stat-value">{totalWaiting}</div>
                                </div>
                            </div>

                            <p className="page-title" style={{ fontSize: "1rem", marginBottom: "12px" }}>All Services</p>
                            <div className="services-grid">
                                {services.map(s => (
                                    <div key={s.id} className="service-card">
                                        <h3>{s.name}</h3>
                                        <div style={{ marginBottom: "10px" }}>
                                            <span className={`badge ${s.is_open ? "open" : "closed"}`}>
                                                {s.is_open ? "Open" : "Closed"}
                                            </span>
                                            <span className={`badge ${s.priority}`}>{s.priority}</span>
                                        </div>
                                        <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "10px" }}>
                                            {Number(s.queue_length) || 0} waiting
                                            {s.max_capacity ? ` / ${s.max_capacity} max` : ""}
                                            {" · "}{s.expected_duration} min avg
                                        </p>
                                        <button
                                            className={`btn btn-sm ${s.is_open ? "btn-danger" : "btn-success"}`}
                                            onClick={() => toggleQueue(s.id)}
                                        >
                                            {s.is_open ? "Close Queue" : "Open Queue"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── SERVICES ── */}
                    {page === "services" && (
                        <ServiceManager services={services} fetchServices={fetchServices} notify={notify} />
                    )}

                    {/* ── QUEUE ── */}
                    {page === "queue" && (
                        <div>
                            <div style={{ marginBottom: "0px" }}>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--muted)", marginTop: "5%" }}>
                                    Select a Service
                                </label>
                                <select
                                    className="form-control"
                                    style={{ maxWidth: "320px" }}
                                    onChange={e => setSelectedId(Number(e.target.value))}
                                    value={selectedId || ""}
                                >
                                    <option value="">-- Select service --</option>
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({Number(s.queue_length) || 0} waiting)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedId > 0 && (
                                <div className="card">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                        <h3 style={{ margin: 0 }}>{selectedService?.name} Queue</h3>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => fetchQueue(selectedId)}>↻ Refresh</button>
                                            <button className="btn btn-success btn-sm" onClick={serveNext}>Serve Next</button>
                                        </div>
                                    </div>

                                    {selectedQueue.length === 0 ? (
                                        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No users currently waiting.</p>
                                    ) : (
                                        selectedQueue.map(entry => (
                                            <div key={entry.id} className="queue-entry-row">
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <div className="position-badge">#{entry.position}</div>
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{entry.user_name}</div>
                                                        <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                                                            Wait: {entry.estimated_wait} min · Joined {new Date(entry.time_joined).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── REPORTS ── */}
                    {page === "reports" && <ReportsPage notify={notify} />}
                </div>
            </main>
        </div>
    );
};

// ── SERVICE MANAGER ──────────────────────────────────────────────────────────
const ServiceManager = ({ services, fetchServices, notify }) => {
    const [form, setForm] = useState({
        name: "", description: "", duration: "", priority: "low", max_capacity: ""
    });
    const [loading, setLoading] = useState(false);
    const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res  = await fetch(`${API}/services`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    duration: Number(form.duration),
                    priority: form.priority,
                    max_capacity: form.max_capacity === "" ? null : Number(form.max_capacity),
                }),
            });
            const data = await res.json();
            if (!res.ok) return notify(data.error || "Failed to create service.");
            notify(`Service "${data.name}" created successfully!`);
            setForm({ name: "", description: "", duration: "", priority: "low", max_capacity: "" });
            fetchServices();
        } catch { notify("Error creating service."); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Create form */}
            <div className="card">
                <h3>Create New Service</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Service Name *</label>
                        <input name="name" required maxLength={100} className="form-control"
                            placeholder="e.g. Tech Support" value={form.name} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Description *</label>
                        <input name="description" required className="form-control"
                            placeholder="Brief description" value={form.description} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Expected Duration (minutes) *</label>
                        <input name="duration" type="number" required min={1} className="form-control"
                            placeholder="15" value={form.duration} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Priority *</label>
                        <select name="priority" className="form-control" value={form.priority} onChange={handleChange}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Max Capacity (optional — leave blank for unlimited)</label>
                        <input name="max_capacity" type="number" min={1} className="form-control"
                            placeholder="e.g. 20" value={form.max_capacity} onChange={handleChange} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
                        {loading ? "Creating..." : "Create Service"}
                    </button>
                </form>
            </div>

            {/* Existing services */}
            <div className="card">
                <h3>Existing Services ({services.length})</h3>
                {services.map(s => (
                    <div key={s.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: "4px" }}>{s.name}</div>
                                <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                                    {s.expected_duration} min · {s.max_capacity ? `Max ${s.max_capacity}` : "Unlimited"} · {Number(s.queue_length) || 0} waiting
                                </div>
                            </div>
                            <div>
                                <span className={`badge ${s.is_open ? "open" : "closed"}`}>
                                    {s.is_open ? "Open" : "Closed"}
                                </span>
                                <span className={`badge ${s.priority}`}>{s.priority}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminHome;