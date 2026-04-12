const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { SECRET } = require("../../middleware/mid_auth");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || name.trim().length === 0)
    return res.status(400).json({ error: "Name is required" });
  if (name.trim().length > 100)
    return res.status(400).json({ error: "Name must be under 100 characters" });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "Valid email is required" });
  if (!password || password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });
 
  try {
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase()]
    );
    if (existing.length > 0)
      return res.status(409).json({ error: "Email already registered" });
 
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name.trim(), email.toLowerCase(), hashed, "user"]
    );
 
    return res.status(201).json({ message: "Registration successful.", userId: result.insertId });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "Invalid email format" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });
 
  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email.toLowerCase()]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid email or password" });
 
    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: "Invalid email or password" });
 
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      SECRET,
      { expiresIn: "8h" }
    );
 
    return res.status(200).json({ message: "Login successful.", token, role: user.role, name: user.name });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
