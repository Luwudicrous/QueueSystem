const express = require("express");
const router = express.Router();
const notif = require("../modules/notifications");

// gets the user's notifications via userID
router.get("/:userId", (req, res) => {
  const list = notif.getNotifications(Number(req.params.userId));
  return res.json(list);
});

// reads a notification by its ID
router.patch("/:id/read", (req, res) => {
  const result = notif.markRead(req.params.id);
  if (!result.success) return res.status(404).json({ error: result.error });
  return res.json({ message: "Marked as read." });
});

// reads all notifications for a user
router.patch("/user/:userId/read-all", (req, res) => {
  notif.markAllRead(Number(req.params.userId));
  return res.json({ message: "All notifications marked as read." });
});

module.exports = router;
