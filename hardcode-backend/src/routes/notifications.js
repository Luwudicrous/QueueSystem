const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticate } = require("../../middleware/mid_auth");

// gets the user's notifications via userID
router.get("/:userId",  authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, user_id, queue_entry_id, \`Message\`, \`Type\`, \`Is Read\`, \`Created/Sent\`
       FROM notifications
       WHERE user_id = ?
       ORDER BY \`Created/Sent\` DESC`,
      [req.params.userId]
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// reads a notification by its ID
router.patch("/:id/read", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id FROM notifications WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Notification not found" });
 
    await db.query(
      "UPDATE notifications SET `Is Read` = 1 WHERE id = ?",
      [req.params.id]
    );
    return res.json({ message: "Marked as read." });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// reads all notifications for a user
router.patch("/user/:userId/read-all", authenticate, async (req, res) => {
  try {
    await db.query(
      "UPDATE notifications SET `Is Read` = 1 WHERE user_id = ?",
      [req.params.userId]
    );
    return res.json({ message: "All notifications marked as read." });
  } catch (err) {
  return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
