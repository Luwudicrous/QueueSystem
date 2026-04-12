const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticate, adminOnly } = require("../../middleware/mid_auth");

// list all services
router.get("/", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM services");
    return res.json(rows);
  } catch (err) {
  return res.status(500).json({ error: "Server error" });
  }
});

// shows the single services
router.get("/:id", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM services WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Service not found." });
    return res.json(rows[0]);
  } catch (err) {
  return res.status(500).json({ error: "Server error" });
}});

// creates a new service (Admin)
router.post("/", authenticate, adminOnly, async (req, res) => {
  const { name, description, duration, priority } = req.body;
  
  if (!name || name.trim().length === 0)
    return res.status(400).json({ error: "Service name is required" });
  if (name.trim().length > 100)
    return res.status(400).json({ error: "Name must be under 100 characters" });
  if (!description || description.trim().length === 0)
    return res.status(400).json({ error: "Description is required" });
  if (!duration || Number(duration) < 1)
    return res.status(400).json({ error: "Duration must be a positive number" });
  if (!["low", "medium", "high"].includes(priority))
    return res.status(400).json({ error: "Priority must be low, medium, or high" });
 
  try {
    const [existing] = await db.query(
      "SELECT id FROM services WHERE name = ?",
      [name.trim()]
    );
    if (existing.length > 0)
      return res.status(409).json({ error: "A service with that name already exists" });
 
    const [result] = await db.query(
      "INSERT INTO services (name, description, expected_duration, priority, is_open) VALUES (?, ?, ?, ?, 1)",
      [name.trim(), description.trim(), Number(duration), priority]
    );
 
    const [rows] = await db.query(
      "SELECT * FROM services WHERE id = ?",
      [result.insertId]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// updates the service (Admin)
router.patch("/:id", authenticate, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM services WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(400).json({ error: "Service not found" });
 
    const { name, description, duration, priority } = req.body;
    const service = rows[0];
 
    const updatedName        = name        || service.name;
    const updatedDescription = description || service.description;
    const updatedDuration    = duration    || service.expected_duration;
    const updatedPriority    = priority    || service.priority;
 
    await db.query(
      "UPDATE services SET name = ?, description = ?, expected_duration = ?, priority = ? WHERE id = ?",
      [updatedName, updatedDescription, Number(updatedDuration), updatedPriority, req.params.id]
    );
 
    const [updated] = await db.query(
      "SELECT * FROM services WHERE id = ?",
      [req.params.id]
    );
    return res.json(updated[0]);
  } catch (err) {
  return res.status(500).json({ error: "Server error" });
}});

// opens and closes a service (Admin)
router.patch("/:id/toggle", authenticate, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM services WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Service not found" });
 
    const service = rows[0];
    await db.query(
      "UPDATE services SET is_open = ? WHERE id = ?",
      [!service.is_open, req.params.id]
    );
 
    const [updated] = await db.query(
      "SELECT * FROM services WHERE id = ?",
      [req.params.id]
    );
    return res.json(updated[0]);
  } catch (err) {
  return res.status(500).json({ error: "Server error" });
}});

module.exports = router;
