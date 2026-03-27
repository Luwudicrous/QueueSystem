const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());                       // allow React dev server on :5173
app.use(express.json());               // parse JSON bodies

// Routes
app.use("/api/auth",          require("./src/routes/auth"));
app.use("/api/services",      require("./src/routes/services"));
app.use("/api/queue",         require("./src/routes/queue"));
app.use("/api/notifications", require("./src/routes/notifications"));
app.use("/api/history",       require("./src/routes/history"));

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
