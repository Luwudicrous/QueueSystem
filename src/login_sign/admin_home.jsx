import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import './admin_home.css'


const AdminHome = () => {

    const [notification, setNotification] = useState(null);

    const [page, setPage] = useState("dashboard");

    const [services, setServices] = useState([
        {
            id: 1,
            name: "Tech Support",
            description: "Fix device issues",
            duration: 15,
            priority: "high",
            open: true,
            queue: ["Alice", "Bob", "Charlie"]
        },
        {
            id: 2,
            name: "Advising",
            description: "Student help",
            duration: 30,
            priority: "medium",
            open: false,
            queue: []
        }
    ]);
    
    const [selectedId, setSelectedId] = useState(null);

    const notify = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 2500)
    };

    const selectedService = services.find(s => s.id === selectedId);

    const serveNext = () => {
    setServices(prev =>
        prev.map(s =>
        s.id === selectedId
            ? { ...s, queue: s.queue.slice(1) }
            : s
        )
    )
    notify("Serving next user") 
    };

    const removeUser = (index) => {
    setServices(prev =>
        prev.map(s =>
        s.id === selectedId
            ? { ...s, queue: s.queue.filter((_, i) => i !== index) }
            : s
        )
    )
    notify("Removed user from queue")  
    };

    const toggleQueue = id => {
    setServices(prev =>
        prev.map(s => {
        if (s.id === id){
            notify(`Queue ${s.open ? "closed" : "opened"} for ${s.name}`) 
            return { ...s, open: !s.open }
        }
        return s
        })
    )
    };

    return (
    <div className="admin-home-background">
      <div className="login-sign-container">

        <div className="header">
            Admin Panel
            <div className="underline"></div>
        </div>
        
        {/* Notification UI */}
        {notification && (
            <div className="login-sign-container">
                {notification}
            </div>
        )}

        {/* Navigation Tabs */}
        <div className="submit-box">
          <button className="submit" onClick={() => setPage("dashboard")}>Dashboard</button>
          <button className="submit" onClick={() => setPage("services")}>Services</button>
          <button className="submit" 
          onClick={() => setPage("queue")}>Queue</button>
        </div>

        {/* DASHBOARD */}
        {page === "dashboard" && (
          <div>
            <h2>Services Overview</h2>

            {services.map(service => (
              <div key={service.id} className="card">
                <h3>{service.name}</h3>
                <p>Queue Length: {service.queue.length}</p>
                <p>Status: {service.open ? "Open" : "Closed"}</p>

                <button onClick={() => toggleQueue(service.id)}>
                  {service.open ? "Close Queue" : "Open Queue"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* SERVICE MANAGEMENT */}
        {page === "services" && (
          <ServiceManager services={services} setServices={setServices} notify={notify}/>
        )}

        {/* QUEUE MANAGEMENT */}
        {page === "queue" && (
          <div>
            <h2>Queue Manager</h2>

            <select onChange={e => setSelectedId(Number(e.target.value))}>
              <option>Select service</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {selectedService && (
              <div className="login-sign-container">
                <h3>{selectedService.name} Queue</h3>

                {selectedService.queue.length === 0 && <p>No users</p>}

                {selectedService.queue.map((user, i) => (
                  <div key={i}>
                    {user}
                    <button onClick={() => removeUser(i)}>Remove</button>
                  </div>
                ))}

                <button onClick={serveNext}>Serve Next</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

/* ---------------- SERVICE MANAGER COMPONENT ---------------- */

const ServiceManager = ({ services, setServices, notify }) => {

  const [form, setForm] = useState({
    name: "",
    description: "",
    duration: "",
    priority: "low"
  })

  const handleChange = e => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = e => {
    e.preventDefault()

    if (!form.name || form.name.length > 100){
        notify("Service name invalid")
        return
    }

    if (!form.description){
        notify("Description required")
        return
    }

    if (!form.duration){
        notify("Duration required")
        return
    }

    const newService = {
      id: Date.now(),
      ...form,
      duration: Number(form.duration),
      open: true,
      queue: []
    }

    setServices(prev => [...prev, newService])

    setForm({
      name: "",
      description: "",
      duration: "",
      priority: "low"
    })

    notify("Service created sucessfully");
  }

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

    <select
    name="priority"
    value={form.priority}
    onChange={handleChange}
    >
    <option value="low">Low</option>
    <option value="medium">Medium</option>
    <option value="high">High</option>
    </select>

    <div className="submit-box">
    <button className="submit" type="submit">
        Add Service
    </button>
    </div>

      </form>

      <h3>Existing Services</h3>
      {services.map(s => (
        <div key={s.id} className="card">
          {s.name} — {s.priority}
        </div>
      ))}
    </div>
  )
}

export default AdminHome