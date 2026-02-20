import React, { useMemo, useState } from "react";
import "./user_home_temp.css";

const UserHome = () => {
  // ---- Notifications (in-app only) ----
  const [notification, setNotification] = useState(null);
  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  // ---- Simple tab navigation (matches Admin style) ----
  const [page, setPage] = useState("dashboard");

  // ---- Mock services (User sees active services + estimated wait) ----
  const [services, setServices] = useState([
    {
      id: 1,
      name: "Tech Support",
      description: "Fix device issues",
      duration: 15, // minutes
      priority: "high",
      open: true,
      queueLength: 3,
    },
    {
      id: 2,
      name: "Advising",
      description: "Student help",
      duration: 30,
      priority: "medium",
      open: false,
      queueLength: 0,
    },
    {
      id: 3,
      name: "Financial Aid",
      description: "Scholarships and account questions",
      duration: 20,
      priority: "low",
      open: true,
      queueLength: 5,
    },
  ]);

  // ---- User's current queue membership (mock state) ----
  const [currentQueue, setCurrentQueue] = useState({
    isInQueue: false,
    serviceId: null,
    serviceName: "",
    position: null,
    etaMinutes: null,
    status: "waiting", // waiting | almost ready | served
    joinedAt: null,
  });

  // ---- History (mock) ----
  const [history, setHistory] = useState([
    { id: 101, date: "2026-02-10", serviceName: "Tech Support", outcome: "Served" },
    { id: 102, date: "2026-02-12", serviceName: "Advising", outcome: "Left" },
  ]);

  // ---- Dashboard computed summary ----
  const activeServices = useMemo(() => services.filter((s) => s.open), [services]);
  const notificationsSummary = useMemo(() => {
    if (!currentQueue.isInQueue) return "No active queue updates.";
    return `You are in ${currentQueue.serviceName}. Status: ${currentQueue.status}`;
  }, [currentQueue]);

  // ---- Join Queue state ----
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const selectedService = useMemo(() => {
    const idNum = Number(selectedServiceId);
    return services.find((s) => s.id === idNum) || null;
  }, [selectedServiceId, services]);

  const estimateWaitMinutes = (service) => {
    // super simple estimate: queueLength * duration
    if (!service) return null;
    return service.queueLength * service.duration;
  };

  const handleJoinQueue = () => {
    if (!selectedService) {
      notify("Please select a service.");
      return;
    }
    if (!selectedService.open) {
      notify("This service is currently closed.");
      return;
    }
    if (currentQueue.isInQueue) {
      notify("You are already in a queue. Leave current queue first.");
      return;
    }

    const eta = estimateWaitMinutes(selectedService);

    // Simulate joining: place user at end of queue
    setCurrentQueue({
      isInQueue: true,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      position: selectedService.queueLength + 1,
      etaMinutes: eta + selectedService.duration, // rough
      status: "waiting",
      joinedAt: new Date().toISOString(),
    });

    // Increase queue length to simulate user added
    setServices((prev) =>
      prev.map((s) =>
        s.id === selectedService.id ? { ...s, queueLength: s.queueLength + 1 } : s
      )
    );

    notify(`Joined ${selectedService.name} queue.`);
    setPage("status");
  };

  const handleLeaveQueue = () => {
    if (!currentQueue.isInQueue) {
      notify("You are not currently in a queue.");
      return;
    }

    // Add to history
    setHistory((prev) => [
      {
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        serviceName: currentQueue.serviceName,
        outcome: "Left",
      },
      ...prev,
    ]);

    // Decrease queue length (simple simulation)
    setServices((prev) =>
      prev.map((s) =>
        s.id === currentQueue.serviceId && s.queueLength > 0
          ? { ...s, queueLength: s.queueLength - 1 }
          : s
      )
    );

    notify("Left the queue.");
    setCurrentQueue({
      isInQueue: false,
      serviceId: null,
      serviceName: "",
      position: null,
      etaMinutes: null,
      status: "waiting",
      joinedAt: null,
    });
  };

  // ---- Queue status simulation controls (UI only) ----
  const simulateStatus = (nextStatus) => {
    if (!currentQueue.isInQueue) {
      notify("Join a queue to see status updates.");
      return;
    }
    
    if (nextStatus === "waiting") {
        notify("Status update: Waiting");
        setCurrentQueue((prev) => ({ ...prev, status: "waiting" }));
    return;
    }

    if (nextStatus === "almost ready") {
        notify("Status update: Almost Ready");
        setCurrentQueue((prev) => ({
            ...prev,
            status: "almost ready",
            etaMinutes: prev.etaMinutes ? Math.max(1, Math.floor(prev.etaMinutes / 2)) : prev.etaMinutes,
            position: prev.position ? Math.max(1, Math.floor(prev.position / 2)) : prev.position,
        }));
        return;
    }

    if (nextStatus === "served") {
      notify("Status update: Served");

      // move to history
      setHistory((prev) => [
        {
          id: Date.now(),
          date: new Date().toISOString().slice(0, 10),
          serviceName: currentQueue.serviceName,
          outcome: "Served",
        },
        ...prev,
      ]);

      // clear current queue
      setCurrentQueue({
        isInQueue: false,
        serviceId: null,
        serviceName: "",
        position: null,
        etaMinutes: null,
        status: "waiting",
        joinedAt: null,
      });
    }
  };

  return (
    <div className="user-home-background">
      <div className="login-sign-container">
        <div className="header">
          User Portal
          <div className="underline"></div>
        </div>

        {/* Notification UI (matches Admin pattern) */}
        {notification && <div className="login-sign-container">{notification}</div>}

        {/* Navigation Tabs */}
        <div className="submit-box">
          <button className="submit" onClick={() => setPage("dashboard")}>
            Dashboard
          </button>
          <button className="submit" onClick={() => setPage("join")}>
            Join Queue
          </button>
          <button className="submit" onClick={() => setPage("status")}>
            Queue Status
          </button>
          <button className="submit" onClick={() => setPage("history")}>
            History
          </button>
        </div>

        {/* ---------------- DASHBOARD ---------------- */}
        {page === "dashboard" && (
          <div>
            <h2>Overview</h2>

            <div className="card">
              <h3>Current Queue Status</h3>
              {!currentQueue.isInQueue ? (
                <p>You are not currently in a queue.</p>
              ) : (
                <>
                  <p>
                    Service: <b>{currentQueue.serviceName}</b>
                  </p>
                  <p>
                    Position: <b>{currentQueue.position}</b>
                  </p>
                  <p>
                    Estimated Wait: <b>{currentQueue.etaMinutes} minutes</b>
                  </p>
                  <p>
                    Status: <b>{currentQueue.status}</b>
                  </p>
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
                    <div>Queue Length: {s.queueLength}</div>
                    <div>Estimated Wait: {estimateWaitMinutes(s)} minutes</div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3>Notifications</h3>
              <p>{notificationsSummary}</p>
              <p>(In-app notifications only for Assignment 2)</p>
            </div>
          </div>
        )}

        {/* ---------------- JOIN QUEUE ---------------- */}
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
                      {s.name} ({s.open ? "Open" : "Closed"})
                    </option>
                  ))}
                </select>
              </label>

              {selectedService && (
                <div style={{ marginTop: "12px" }}>
                  <h3>{selectedService.name}</h3>
                  <p>{selectedService.description}</p>
                  <p>
                    Expected Duration: <b>{selectedService.duration} min</b>
                  </p>
                  <p>
                    Current Queue Length: <b>{selectedService.queueLength}</b>
                  </p>
                  <p>
                    Estimated Wait Time:{" "}
                    <b>{estimateWaitMinutes(selectedService)} minutes</b>
                  </p>
                </div>
              )}

              <div className="submit-box" style={{ marginTop: "12px" }}>
                {!currentQueue.isInQueue ? (
                  <button className="submit" onClick={handleJoinQueue}>
                    Join Queue
                  </button>
                ) : (
                  <button className="submit" onClick={handleLeaveQueue}>
                    Leave Current Queue
                  </button>
                )}
              </div>

              {currentQueue.isInQueue && (
                <p style={{ marginTop: "10px" }}>
                  You are currently in <b>{currentQueue.serviceName}</b>. Go to{" "}
                  <b>Queue Status</b>.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ---------------- QUEUE STATUS ---------------- */}
        {page === "status" && (
          <div>
            <h2>Queue Status</h2>

            {!currentQueue.isInQueue ? (
              <div className="card">
                <p>You are not currently in a queue.</p>
                <button onClick={() => setPage("join")}>Go Join a Queue</button>
              </div>
            ) : (
              <div className="card">
                <p>
                  Service: <b>{currentQueue.serviceName}</b>
                </p>
                <p>
                  Current Position: <b>{currentQueue.position}</b>
                </p>
                <p>
                  Estimated Wait Time: <b>{currentQueue.etaMinutes} minutes</b>
                </p>
                <p>
                  Status: <b>{currentQueue.status}</b>
                </p>

                <h3>Status Updates (UI Simulation)</h3>
                <div className="submit-box">
                  <button className="submit" onClick={() => simulateStatus("waiting")}>
                    Waiting
                  </button>
                  <button className="submit" onClick={() => simulateStatus("almost ready")}>
                    Almost Ready
                  </button>
                  <button className="submit" onClick={() => simulateStatus("served")}>
                    Served
                  </button>
                </div>

                <button onClick={handleLeaveQueue} style={{ marginTop: "12px" }}>
                  Leave Queue
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------- HISTORY ---------------- */}
        {page === "history" && (
          <div>
            <h2>History</h2>

            <div className="card">
              {history.length === 0 ? (
                <p>No history yet.</p>
              ) : (
                history.map((h) => (
                  <div key={h.id} style={{ marginBottom: "12px" }}>
                    <div>
                      <b>{h.serviceName}</b>
                    </div>
                    <div>Date: {h.date}</div>
                    <div>Outcome: {h.outcome}</div>
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