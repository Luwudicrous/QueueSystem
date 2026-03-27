const express = require("express");
const router = express.Router();
const queue = require("../modules/queue");

// Views the live queue for a service (Admin)
router.get("/:serviceId", (req, res) => {
  const q = queue.getQueue(req.params.serviceId);
  return res.json(q);
});

// User joins a queue
router.post("/join", (req, res) => {
  const { userId, userName, serviceId } = req.body;
  const result = queue.joinQueue({ userId, userName, serviceId });
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.status(201).json(result.entry);
});

// User leaves a queue
router.post("/leave", (req, res) => {
  const { userId, serviceId } = req.body;
  const result = queue.leaveQueue({ userId, serviceId });
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.json({ message: "Left queue successfully." });
});

// Admin serves the next user in the queue
router.post("/:serviceId/serve-next", (req, res) => {
  // based on service ID
  const result = queue.serveNext(req.params.serviceId);
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.json({ message: `Serving ${result.servedUser}.` });
});

// User checks their queue status
router.get("/status/:userId", (req, res) => {
  // gets the queue entry for the user, if any
  const entry = queue.getUserStatus(Number(req.params.userId));
  if (!entry) return res.json({ inQueue: false });
  return res.json({ inQueue: true, ...entry });
});

module.exports = router;
