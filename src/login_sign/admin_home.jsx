import React, { useState, useEffect, useCallback } from 'react'
import './admin_home.css'

const API = "http://localhost:5000/api";

const AdminHome = () => {

    const [notification, setNotification] = useState(null);

    const [page, setPage] = useState("dashboard");

    const [services, setServices] = useState([]);
    const [queues, setQueues] = useState({});   // { [serviceId]: [entries] }
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(false);

    const notify = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 2500);
    };

    // Fetches all services from backend
    const fetchServices = useCallback(async () => {
        try {
            const res = await fetch(`${API}/services`);
            const data = await res.json();
            setServices(data);
        } catch {
            notify("Error fetching services.");
        }
    }, []);

    // Fetch the live queue for one service
    const fetchQueue = useCallback(async (serviceId) => {
        try {
            const res = await fetch(`${API}/queue/${serviceId}`);
            const data = await res.json();
            setQueues(prev => ({ ...prev, [serviceId]: data }));
        } catch {
            notify("Error fetching queue.");
        }
    }, []);

    // Load services on mount
    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    // Load queue whenever selected service changes
    useEffect(() => {
        if (selectedId) fetchQueue(selectedId);
    }, [selectedId, fetchQueue]);

    const toggleQueue = async (id) => {
        try {
            const res = await fetch(`${API}/services/${id}/toggle`, { method: "PATCH" });
            const updated = await res.json();
            if (!res.ok) { notify(updated.error); return; }
            setServices(prev => prev.map(s => s.id === id ? updated : s));
            notify(`Queue ${updated.open ? "opened" : "closed"} for ${updated.name}`);
        } catch {
            notify("Error toggling queue.");
        }
    };

    // Serves next user
    const serveNext = async () => {
        if (!selectedId) return;
        try {
            const res = await fetch(`${API}/queue/${selectedId}/serve-next`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) { notify(data.error); return; }
            notify(data.message);
            fetchQueue(selectedId);
            fetchServices();
        } catch {
            notify("Error serving next user.");
        }
    };

    // Removes a user from queue
    const removeUser = async (entry) => {
        try {
            const res = await fetch(`${API}/queue/leave`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: entry.userId, serviceId: entry.serviceId }),
            });
            const data = await res.json();
            if (!res.ok) { notify(data.error); return; }
            notify(`Removed ${entry.userName} from queue.`);
            fetchQueue(selectedId);
            fetchServices();
        } catch {
            notify("Error removing user.");
        }
    };

    const selectedQueue = queues[selectedId] || [];

    return (
        <div className="admin-home-background">
            <div className="login-sign-container">

                <div className="header">
                    Admin Panel
                    <div className="underline"></div>
                </div>

                {notification && (
                    <div className="login-sign-container">{notification}</div>
                )}

                {/* Navigation Tabs */}
                <div className="submit-box">
                    <button className="submit" onClick={() => { setPage("dashboard"); fetchServices(); }}>Dashboard</button>
                    <button className="submit" onClick={() => { setPage("services"); fetchServices(); }}>Services</button>
                    <button className="submit" onClick={() => setPage("queue")}>Queue</button>
                </div>

                {/* Dashboard */}
                {page === "dashboard" && (
                    <div>
                        <h2>Services Overview</h2>
                        {services.length === 0 && <p>Loading services...</p>}
                        {services.map(service => (
                            <div key={service.id} className="card">
                                <h3>{service.name}</h3>
                                <p>Queue Length: {service.queueLength}</p>
                                <p>Status: {service.open ? "Open" : "Closed"}</p>
                                <button onClick={() => toggleQueue(service.id)}>
                                    {service.open ? "Close Queue" : "Open Queue"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Service Management */}
                {page === "services" && (
                    <ServiceManager
                        services={services}
                        fetchServices={fetchServices}
                        notify={notify}
                    />
                )}

                {/* Queue Management */}
                {page === "queue" && (
                    <div>
                        <h2>Queue Manager</h2>
                        <select onChange={e => {
                            const id = Number(e.target.value);
                            setSelectedId(id);
                            if (id) fetchQueue(id);
                        }}>
                            <option value="">Select service</option>
                            {services.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>

                        {selectedId > 0 && (
                            <div className="login-sign-container" style={{ marginTop: "16px" }}>
                                <h3>{services.find(s => s.id === selectedId)?.name} Queue</h3>

                                {selectedQueue.length === 0 && <p>No users in queue.</p>}

                                {selectedQueue.map((entry) => (
                                    <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <span>#{entry.position} — {entry.userName} (ETA: {entry.etaMinutes} min)</span>
                                        <button onClick={() => removeUser(entry)}>Remove</button>
                                    </div>
                                ))}

                                <button onClick={serveNext} style={{ marginTop: "12px" }}>
                                    Serve Next
                                </button>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

// Service Manager

const ServiceManager = ({ services, fetchServices, notify }) => {

    const [form, setForm] = useState({
        name: "",
        description: "",
        duration: "",
        priority: "low"
    });

    const handleChange = e => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/services`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    duration: Number(form.duration),
                    priority: form.priority,
                }),
            });
            const data = await res.json();
            if (!res.ok) { notify(data.error || "Failed to create service."); return; }
            notify("Service created successfully!");
            setForm({ name: "", description: "", duration: "", priority: "low" });
            fetchServices();
        } catch {
            notify("Error creating service.");
        }
    };

    return (
        <div>
            <h2>Create Service</h2>

            <form onSubmit={handleSubmit} className="card">
                <div className="inputs">
                    <div className="input">
                        <input
                            name="name" required maxLength={100}
                            placeholder="Service Name"
                            value={form.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input">
                        <input
                            name="description"
                            placeholder="Description"
                            value={form.description}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="input">
                        <input
                            name="duration"
                            type="number" required min={1}
                            placeholder="Expected Duration (minutes)"
                            value={form.duration}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <select name="priority" value={form.priority} onChange={handleChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>

                <div className="submit-box">
                    <button className="submit" type="submit">Add Service</button>
                </div>
            </form>

            <h3>Existing Services</h3>
            {services.map(s => (
                <div key={s.id} className="card">
                    {s.name} — {s.priority} — {s.open ? "Open" : "Closed"} — {s.queueLength} in queue
                </div>
            ))}
        </div>
    );
};

export default AdminHome;
