import React, { useState, useEffect } from "react";

const API = "http://localhost:5001/api";
const token = () => sessionStorage.getItem("token");
const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
});

const ReportsPage = ({ notify }) => {
    const [tab, setTab] = useState("summary");
    const [summary, setSummary] = useState(null);
    const [users, setUsers] = useState([]);
    const [services, setServices] = useState([]);
    const [history, setHistory] = useState([]);
    const [filters, setFilters] = useState({ serviceId: "", from: "", to: "" });
    const [allServices, setAllServices] = useState([]);

    useEffect(() => {
        fetchSummary();
        fetchAllServices();
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await fetch(`${API}/reports/summary`, { headers: authHeaders() });
            const data = await res.json();
            if (res.ok) setSummary(data);
        } catch { notify("Error loading summary."); }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API}/reports/users`, { headers: authHeaders() });
            const data = await res.json();
            if (res.ok) setUsers(data);
        } catch { notify("Error loading user report."); }
    };

    const fetchServices = async () => {
        try {
            const res = await fetch(`${API}/reports/services`, { headers: authHeaders() });
            const data = await res.json();
            if (res.ok) setServices(data);
        } catch { notify("Error loading service report."); }
    };

    const fetchHistory = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.serviceId) params.append("serviceId", filters.serviceId);
            if (filters.from)      params.append("from", filters.from);
            if (filters.to)        params.append("to", filters.to);

            const res = await fetch(`${API}/reports/history?${params}`, { headers: authHeaders() });
            const data = await res.json();
            if (res.ok) setHistory(data);
        } catch { notify("Error loading history report."); }
    };

    const fetchAllServices = async () => {
        try {
            const res = await fetch(`${API}/services`, { headers: authHeaders() });
            const data = await res.json();
            if (res.ok) setAllServices(data);
        } catch {}
    };

    // CSV export helper
    const exportCSV = (data, filename) => {
        if (!data || data.length === 0) { notify("No data to export."); return; }
        const headers = Object.keys(data[0]).join(",");
        const rows    = data.map(row =>
            Object.values(row).map(v =>
                v === null ? "" : `"${String(v).replace(/"/g, '""')}"`
            ).join(",")
        );
        const csv  = [headers, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <h2>Reports</h2>

            {/* Report Tabs */}
            <div className="submit-box" style={{ marginBottom: "16px" }}>
                <button className="submit" onClick={() => { setTab("summary"); fetchSummary(); }}>Summary</button>
                <button className="submit" onClick={() => { setTab("users"); fetchUsers(); }}>Users</button>
                <button className="submit" onClick={() => { setTab("services"); fetchServices(); }}>Services</button>
                <button className="submit" onClick={() => { setTab("history"); fetchHistory(); }}>History</button>
            </div>

            {/* SUMMARY */}
            {tab === "summary" && summary && (
                <div className="card">
                    <h3>System Overview</h3>
                    <p>Total Users: <b>{summary.total_users}</b></p>
                    <p>Total Services: <b>{summary.total_services}</b></p>
                    <p>Total Users Served: <b>{summary.total_served}</b></p>
                    <p>Currently Waiting: <b>{summary.currently_waiting}</b></p>
                    <p>Average Wait Time: <b>{summary.average_wait_minutes} minutes</b></p>
                    <button
                        className="submit"
                        style={{ marginTop: "12px" }}
                        onClick={() => exportCSV([summary], "queuesmart_summary.csv")}
                    >
                        Export CSV
                    </button>
                </div>
            )}

            {/* USERS */}
            {tab === "users" && (
                <div className="card">
                    <h3>User Participation Report</h3>
                    <button
                        className="submit"
                        style={{ marginBottom: "12px" }}
                        onClick={() => exportCSV(users, "queuesmart_users.csv")}
                    >
                        Export CSV
                    </button>
                    {users.length === 0 ? <p>No data.</p> : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #ccc" }}>
                                    <th style={{ textAlign: "left", padding: "6px" }}>Name</th>
                                    <th style={{ textAlign: "left", padding: "6px" }}>Email</th>
                                    <th style={{ textAlign: "center", padding: "6px" }}>Total Visits</th>
                                    <th style={{ textAlign: "center", padding: "6px" }}>Served</th>
                                    <th style={{ textAlign: "center", padding: "6px" }}>Left Early</th>
                                    <th style={{ textAlign: "left", padding: "6px" }}>Last Visit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={{ padding: "6px" }}>{u.name}</td>
                                        <td style={{ padding: "6px" }}>{u.email}</td>
                                        <td style={{ textAlign: "center", padding: "6px" }}>{u.total_visits}</td>
                                        <td style={{ textAlign: "center", padding: "6px" }}>{u.times_served}</td>
                                        <td style={{ textAlign: "center", padding: "6px" }}>{u.times_left}</td>
                                        <td style={{ padding: "6px" }}>{u.last_visit?.slice(0, 10) || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* SERVICES */}
            {tab === "services" && (
                <div className="card">
                    <h3>Service Activity Report</h3>
                    <button
                        className="submit"
                        style={{ marginBottom: "12px" }}
                        onClick={() => exportCSV(services, "queuesmart_services.csv")}
                    >
                        Export CSV
                    </button>
                    {services.length === 0 ? <p>No data.</p> : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #ccc" }}>
                                    <th style={{ textAlign: "left", padding: "6px" }}>Service</th>
                                    <th style={{ textAlign: "center", padding: "6px" }}>Status</th>
                                    <th style={{ textAlign: "center", padding: "6px" }}>Total Served</th>
                                    <th style={{ textAlign: "center", padding: "6px" }}>Waiting Now</th>
                                    <th style={{ textAlign: "center", padding: "6px" }}>Canceled</th>
                                    <th style={{ textAlign: "center", padding: "6px" }}>Avg Wait</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map(s => (
                                    <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={{ padding: "6px" }}>{s.name}</td>
                                        <td style={{ textAlign: "center", padding: "6px" }}>{s.is_open ? "Open" : "Closed"}</td>
                                        <td style={{ textAlign: "center", padding: "6px" }}>{s.total_served}</td>
                                        <td style={{ textAlign: "center", padding: "6px" }}>{s.currently_waiting}</td>
                                        <td style={{ textAlign: "center", padding: "6px" }}>{s.total_canceled}</td>
                                        <td style={{ textAlign: "center", padding: "6px" }}>{s.avg_wait ? `${Math.round(s.avg_wait)} min` : "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* HISTORY */}
            {tab === "history" && (
                <div className="card">
                    <h3>Queue History Report</h3>

                    {/* Filters */}
                    <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                        <select
                            value={filters.serviceId}
                            onChange={e => setFilters(prev => ({ ...prev, serviceId: e.target.value }))}
                        >
                            <option value="">All Services</option>
                            {allServices.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={filters.from}
                            onChange={e => setFilters(prev => ({ ...prev, from: e.target.value }))}
                        />
                        <input
                            type="date"
                            value={filters.to}
                            onChange={e => setFilters(prev => ({ ...prev, to: e.target.value }))}
                        />
                        <button className="submit" onClick={fetchHistory}>Apply Filters</button>
                        <button className="submit" onClick={() => exportCSV(history, "queuesmart_history.csv")}>Export CSV</button>
                    </div>

                    {history.length === 0 ? <p>No data. Apply filters and click Apply.</p> : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #ccc" }}>
                                    <th style={{ textAlign: "left", padding: "6px" }}>User</th>
                                    <th style={{ textAlign: "left", padding: "6px" }}>Email</th>
                                    <th style={{ textAlign: "left", padding: "6px" }}>Service</th>
                                    <th style={{ textAlign: "center", padding: "6px" }}>Outcome</th>
                                    <th style={{ textAlign: "left", padding: "6px" }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(h => (
                                    <tr key={h.id} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={{ padding: "6px" }}>{h.user_name}</td>
                                        <td style={{ padding: "6px" }}>{h.email}</td>
                                        <td style={{ padding: "6px" }}>{h.service_name}</td>
                                        <td style={{ textAlign: "center", padding: "6px" }}>{h.outcome}</td>
                                        <td style={{ padding: "6px" }}>{h.date?.slice(0, 10)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
