const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticate, adminOnly } = require("../../middleware/mid_auth");

// Gets the user's own history
router.get("/:userId", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT h.*, s.name as service_name
       FROM history h
       JOIN services s ON h.service_id = s.id
       WHERE h.user_id = ?
       ORDER BY h.date DESC`,
      [req.params.userId]
    );
    return res.json(rows);
  } catch (err) {
  return res.status(500).json({ error: "Server error" });
  }
});

// Admin gets to check all history of all users
router.get("/", authenticate, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT h.*, s.name as service_name, u.name as user_name
       FROM history h
       JOIN services s ON h.service_id = s.id
       JOIN users u ON h.user_id = u.id
       ORDER BY h.date DESC`
    );
    return res.json(rows);
  } catch (err) {
  return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
