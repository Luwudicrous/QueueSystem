const express = require("express");
const router = express.Router();
const auth = require("../modules/auth");

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  const result = auth.register({ name, email, password });
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.status(201).json({ message: "Registration successful.", user: result.user });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const result = auth.login({ email, password });
  if (!result.success) return res.status(401).json({ error: result.error });
  return res.status(200).json({ message: "Login successful.", user: result.user });
});

module.exports = router;
