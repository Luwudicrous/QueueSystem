const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticate, adminOnly } = require("../../middleware/mid_auth");

// Views the live queue for a service (Admin)
router.get("/:serviceId", authenticate, adminOnly, async (req, res) => {
  try {
    const [entries] = await db.query(
      `SELECT q.*, u.name as user_name
       FROM queueentries q
       JOIN users u ON q.user_id = u.id
       WHERE q.service_id = ? AND q.status = 'waiting'
       ORDER BY q.position`,
      [req.params.serviceId]
    );
    return res.json(entries);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// User joins a queue
router.post("/join", authenticate, async (req, res) => {
  const { serviceId } = req.body;
  const userId   = req.user.id;
  const userName = req.user.name;
 
  if (!serviceId)
    return res.status(400).json({ error: "serviceId is required" });
 
  try {
    const [services] = await db.query(
      "SELECT * FROM services WHERE id = ?",
      [serviceId]
    );
    if (services.length === 0)
      return res.status(404).json({ error: "Service not found" });
 
    const service = services[0];
    if (!service.is_open)
      return res.status(400).json({ error: "This service is currently closed" });
 
    const [inQueue] = await db.query(
      "SELECT id FROM queueentries WHERE user_id = ? AND status = 'waiting'",
      [userId]
    );
    if (inQueue.length > 0)
      return res.status(400).json({ error: "You are already in a queue. Leave it first." });
 
    const [posResult] = await db.query(
      "SELECT COUNT(*) as count FROM queueentries WHERE service_id = ? AND status = 'waiting'",
      [serviceId]
    );
    const position       = posResult[0].count + 1;
    const estimated_wait = position * service.expected_duration;
 
    const [result] = await db.query(
      "INSERT INTO queueentries (user_id, service_id, position, estimated_wait, status) VALUES (?, ?, ?, ?, 'waiting')",
      [userId, serviceId, position, estimated_wait]
    );
 
    // Log notification
    await db.query(
      "INSERT INTO notifications (user_id, queue_entry_id, `Message`, `Type`) VALUES (?, ?, ?, 'joined')",
      [userId, result.insertId, `You joined the ${service.name} queue. Position: ${position}. Estimated wait: ${estimated_wait} min.`]
    );
 
    const [entry] = await db.query(
      "SELECT * FROM queueentries WHERE id = ?",
      [result.insertId]
    );
    return res.status(201).json(entry[0]);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// User leaves a queue
router.post("/leave", authenticate, async (req, res) => {
  const userId = req.user.id;
 
  try {
    const [entries] = await db.query(
      `SELECT q.*, s.name as service_name
       FROM queueentries q
       JOIN services s ON q.service_id = s.id
       WHERE q.user_id = ? AND q.status = 'waiting'`,
      [userId]
    );
    if (entries.length === 0)
      return res.status(400).json({ error: "You are not in any queue" });
 
    const entry = entries[0];
    await db.query("DELETE FROM queueentries WHERE id = ?", [entry.id]);
 
    // Recalculate positions for remaining users
    const [remaining] = await db.query(
      "SELECT id FROM queueentries WHERE service_id = ? AND status = 'waiting' ORDER BY time_joined",
      [entry.service_id]
    );
    for (let i = 0; i < remaining.length; i++) {
      await db.query(
        "UPDATE queueentries SET position = ?, estimated_wait = ? WHERE id = ?",
        [i + 1, (i + 1) * 15, remaining[i].id]
      );
    }
 
    // Log history
    await db.query(
      "INSERT INTO history (user_id, service_id, outcome) VALUES (?, ?, 'left')",
      [userId, entry.service_id]
    );
 
    // Log notification
    await db.query(
      "INSERT INTO notifications (user_id, queue_entry_id, `Message`, `Type`) VALUES (?, ?, ?, 'left')",
      [userId, entry.id, `You left the ${entry.service_name} queue.`]
    );
 
    return res.json({ message: "Left queue successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// Admin serves the next user in the queue
router.post("/:serviceId/serve-next", authenticate, adminOnly, async (req, res) => {
  // based on service ID
  try {
    const [services] = await db.query(
      "SELECT * FROM services WHERE id = ?",
      [req.params.serviceId]
    );
    if (services.length === 0)
      return res.status(404).json({ error: "Service not found" });
 
    const [entries] = await db.query(
      "SELECT * FROM queueentries WHERE service_id = ? AND status = 'waiting' ORDER BY position LIMIT 1",
      [req.params.serviceId]
    );
    if (entries.length === 0)
      return res.status(400).json({ error: "No users in queue" });
 
    const entry = entries[0];
    await db.query(
      "UPDATE queueentries SET status = 'served', time_served = NOW() WHERE id = ?",
      [entry.id]
    );
 
    // Log history
    await db.query(
      "INSERT INTO history (user_id, service_id, outcome) VALUES (?, ?, 'served')",
      [entry.user_id, req.params.serviceId]
    );
 
    // Notify user
    await db.query(
      "INSERT INTO notifications (user_id, queue_entry_id, `Message`, `Type`) VALUES (?, ?, ?, 'served')",
      [entry.user_id, entry.id, `You are being served at ${services[0].name}!`]
    );
 
    // Recalculate positions
    const [remaining] = await db.query(
      "SELECT id FROM queueentries WHERE service_id = ? AND status = 'waiting' ORDER BY time_joined",
      [req.params.serviceId]
    );
    for (let i = 0; i < remaining.length; i++) {
      await db.query(
        "UPDATE queueentries SET position = ?, estimated_wait = ? WHERE id = ?",
        [i + 1, (i + 1) * services[0].expected_duration, remaining[i].id]
      );
    }
 
    // Get served user name for response
    const [user] = await db.query("SELECT name FROM users WHERE id = ?", [entry.user_id]);
    return res.json({ message: `Serving ${user[0].name}.` });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// User checks their queue status
router.get("/status/:userId", authenticate, async (req, res) => {
  // gets the queue entry for the user, if any
  try {
    const [rows] = await db.query(
      `SELECT q.*, s.name as service_name
       FROM queueentries q
       JOIN services s ON q.service_id = s.id
       WHERE q.user_id = ? AND q.status = 'waiting'`,
      [req.params.userId]
    );
    if (rows.length === 0) return res.json({ inQueue: false });
    return res.json({ inQueue: true, ...rows[0] });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
