const express = require("express");
const router  = express.Router();
const db      = require("../db");
const { authenticate, adminOnly } = require("../../middleware/mid_auth");

// GET /api/reports/summary — overall stats
router.get("/summary", authenticate, adminOnly, async (req, res) => {
  try {
    const [[userCount]]    = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    const [[serviceCount]] = await db.query("SELECT COUNT(*) as count FROM services");
    const [[servedCount]]  = await db.query("SELECT COUNT(*) as count FROM queueentries WHERE status = 'served'");
    const [[waitingCount]] = await db.query("SELECT COUNT(*) as count FROM queueentries WHERE status = 'waiting'");
    const [[avgWait]]      = await db.query("SELECT AVG(estimated_wait) as avg FROM queueentries WHERE status = 'served'");

    res.json({
      total_users:        userCount.count,
      total_services:     serviceCount.count,
      total_served:       servedCount.count,
      currently_waiting:  waitingCount.count,
      average_wait_minutes: avgWait.avg ? Math.round(avgWait.avg) : 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/reports/users — user queue participation history
router.get("/users", authenticate, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        u.id, u.name, u.email,
        COUNT(h.id) as total_visits,
        SUM(CASE WHEN h.outcome = 'served' THEN 1 ELSE 0 END) as times_served,
        SUM(CASE WHEN h.outcome = 'left' THEN 1 ELSE 0 END) as times_left,
        MAX(h.date) as last_visit
       FROM users u
       LEFT JOIN history h ON u.id = h.user_id
       WHERE u.role = 'user'
       GROUP BY u.id, u.name, u.email
       ORDER BY total_visits DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/reports/services — service activity stats
router.get("/services", authenticate, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        s.id, s.name, s.priority, s.is_open, s.expected_duration,
        COUNT(DISTINCT q.id) as total_queue_entries,
        SUM(CASE WHEN q.status = 'served' THEN 1 ELSE 0 END) as total_served,
        SUM(CASE WHEN q.status = 'waiting' THEN 1 ELSE 0 END) as currently_waiting,
        SUM(CASE WHEN q.status = 'canceled' THEN 1 ELSE 0 END) as total_canceled,
        AVG(CASE WHEN q.status = 'served' THEN q.estimated_wait END) as avg_wait
       FROM services s
       LEFT JOIN queueentries q ON s.id = q.service_id
       GROUP BY s.id, s.name, s.priority, s.is_open, s.expected_duration
       ORDER BY total_served DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/reports/history — full history log with optional filters
// Query params: ?serviceId=1&from=2026-01-01&to=2026-12-31
router.get("/history", authenticate, adminOnly, async (req, res) => {
  try {
    const { serviceId, from, to } = req.query;

    let query = `
      SELECT 
        h.id, u.name as user_name, u.email,
        s.name as service_name,
        h.outcome, h.date
      FROM history h
      JOIN users u ON h.user_id = u.id
      JOIN services s ON h.service_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (serviceId) { query += " AND h.service_id = ?"; params.push(serviceId); }
    if (from)      { query += " AND h.date >= ?";       params.push(from); }
    if (to)        { query += " AND h.date <= ?";       params.push(to); }

    query += " ORDER BY h.date DESC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
