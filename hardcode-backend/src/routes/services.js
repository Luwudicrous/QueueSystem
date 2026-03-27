const express = require("express");
const router = express.Router();
const svc = require("../modules/services");

// list all services
router.get("/", (req, res) => {
  return res.json(svc.listServices());
});

// shows the single services
router.get("/:id", (req, res) => {
  const service = svc.getServiceById(req.params.id);
  if (!service) return res.status(404).json({ error: "Service not found." });
  return res.json(service);
});

// creates a new service (Admin)
router.post("/", (req, res) => {
  const { name, description, duration, priority } = req.body;
  const result = svc.createService({ name, description, duration, priority });
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.status(201).json(result.service);
});

// updates the service (Admin)
router.patch("/:id", (req, res) => {
  const result = svc.updateService(req.params.id, req.body);
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.json(result.service);
});

// opens and closes a service (Admin)
router.patch("/:id/toggle", (req, res) => {
  const result = svc.toggleServiceOpen(req.params.id);
  if (!result.success) return res.status(404).json({ error: result.error });
  return res.json(result.service);
});

module.exports = router;
