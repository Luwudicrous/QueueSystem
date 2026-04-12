const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/routes/auth");
const servicesRoutes = require("./src/routes/services");
const queueRoutes = require("./src/routes/queue");
const notificastionsRoutes = require("./src/routes/notifications");
const historyRoutes = require("./src/routes/history");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));  // allow React dev server on :5173
app.use(express.json());               // parse JSON bodies

// Routes
app.use("/api/auth",          authRoutes);
app.use("/api/services",      servicesRoutes);
app.use("/api/queue",         queueRoutes);
app.use("/api/notifications", notificastionsRoutes);
app.use("/api/history",       historyRoutes);

// Health checks for monitoring and testing
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`QueueSmart backend running on http://localhost:${PORT}`);
    console.log(`Test: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;  
