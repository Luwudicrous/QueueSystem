const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticate } = require("../../middleware/mid_auth");

// GET /api/smart/recommend/:serviceId
// Given a service the user wants to join, suggest alternatives with shorter wait times
router.get("/recommend/:serviceId", authenticate, async (req, res) => {
  try {
    const [target] = await db.query(
      "SELECT * FROM services WHERE id = ?",
      [req.params.serviceId]
    );
    if (target.length === 0)
      return res.status(404).json({ error: "Service not found" });

    const targetService = target[0];

    // Count waiting users for target service
    const [[targetQueue]] = await db.query(
      "SELECT COUNT(*) as count FROM queueentries WHERE service_id = ? AND status = 'waiting'",
      [req.params.serviceId]
    );
    const targetWait = (targetQueue.count + 1) * targetService.expected_duration;

    // Get all other open services with their current queue lengths
    const [others] = await db.query(
      `SELECT s.*,
        COUNT(q.id) as queue_length,
        (COUNT(q.id) + 1) * s.expected_duration as estimated_wait
       FROM services s
       LEFT JOIN queueentries q ON s.id = q.service_id AND q.status = 'waiting'
       WHERE s.is_open = 1 AND s.id != ?
       GROUP BY s.id
       ORDER BY estimated_wait ASC`,
      [req.params.serviceId]
    );

    // Find alternatives with shorter wait than the target
    const alternatives = others.filter(s => s.estimated_wait < targetWait);

    res.json({
      selected_service: {
        id: targetService.id,
        name: targetService.name,
        estimated_wait: targetWait,
      },
      alternatives: alternatives.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        estimated_wait: s.estimated_wait,
        queue_length: s.queue_length,
        time_saved: targetWait - s.estimated_wait,
      })),
      has_alternatives: alternatives.length > 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/smart/best-time/:serviceId
// Suggests the best time to join based on historical average queue lengths by hour
router.get("/best-time/:serviceId", authenticate, async (req, res) => {
  try {
    const [service] = await db.query(
      "SELECT * FROM services WHERE id = ?",
      [req.params.serviceId]
    );
    if (service.length === 0)
      return res.status(404).json({ error: "Service not found" });

    // Gets the historical queue activity by hour of day
    const [hourlyData] = await db.query(
      `SELECT 
        HOUR(time_joined) as hour,
        COUNT(*) as total_joins,
        AVG(estimated_wait) as avg_wait
       FROM queueentries
       WHERE service_id = ?
       GROUP BY HOUR(time_joined)
       ORDER BY avg_wait ASC`,
      [req.params.serviceId]
    );

    if (hourlyData.length === 0) {
      return res.json({
        service_name: service[0].name,
        suggestion: "Not enough historical data yet. Try joining early in the morning for shorter waits.",
        best_hours: [],
      });
    }

    // Top 3 least busy hours
    const bestHours = hourlyData.slice(0, 3).map(h => ({
      hour: h.hour,
      label: formatHour(h.hour),
      avg_wait: Math.round(h.avg_wait),
    }));

    res.json({
      service_name: service[0].name,
      suggestion: `Best times to join ${service[0].name} are around ${bestHours.map(h => h.label).join(", ")}.`,
      best_hours: bestHours,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

const formatHour = (hour) => {
  if (hour === 0)  return "12:00 AM";
  if (hour < 12)  return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
};

module.exports = router;
