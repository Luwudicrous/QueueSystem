const store = require("../store");

function validateService({ name, description, duration, priority }) {
  if (!name || typeof name !== "string" || name.trim().length === 0)
    return { valid: false, error: "Service name is required." };
  if (name.trim().length > 100)
    return { valid: false, error: "Service name must be 100 characters or fewer." };

  if (!description || typeof description !== "string" || description.trim().length === 0)
    return { valid: false, error: "Description is required." };
  if (description.trim().length > 300)
    return { valid: false, error: "Description must be 300 characters or fewer." };

  const dur = Number(duration);
  if (!duration && duration !== 0)
    return { valid: false, error: "Duration is required." };
  if (!Number.isInteger(dur) || dur < 1)
    return { valid: false, error: "Duration must be a positive integer (minutes)." };
  if (dur > 480)
    return { valid: false, error: "Duration cannot exceed 480 minutes." };

  const validPriorities = ["low", "medium", "high"];
  if (!priority || !validPriorities.includes(priority))
    return { valid: false, error: "Priority must be low, medium, or high." };

  return { valid: true };
}

// Stores (all in-memory for this assignment)
function listServices() {
  return store.services.map((s) => ({
    ...s,
    queueLength: store.queues.filter(
      (q) => q.serviceId === s.id && q.status === "waiting"
    ).length,
  }));
}

function getServiceById(id) {
  const s = store.services.find((s) => s.id === Number(id));
  if (!s) return null;
  return {
    ...s,
    queueLength: store.queues.filter(
      (q) => q.serviceId === s.id && q.status === "waiting"
    ).length,
  };
}

function createService({ name, description, duration, priority }) {
  const check = validateService({ name, description, duration, priority });
  if (!check.valid) return { success: false, error: check.error };

  const newService = {
    id: store.newServiceId(),
    name: name.trim(),
    description: description.trim(),
    duration: Number(duration),
    priority,
    open: true,
  };

  store.services.push(newService);
  return { success: true, service: { ...newService, queueLength: 0 } };
}

function updateService(id, fields) {
  const idx = store.services.findIndex((s) => s.id === Number(id));
  if (idx === -1) return { success: false, error: "Service not found." };

  // Only allow updating these specific fields
  const allowedFields = ["name", "description", "duration", "priority", "open"];
  const updates = {};
  for (const key of allowedFields) {
    if (fields[key] !== undefined) updates[key] = fields[key];
  }

  // Validate if core fields are being changed
  if (updates.name || updates.description || updates.duration || updates.priority) {
    const merged = { ...store.services[idx], ...updates };
    const check = validateService(merged);
    if (!check.valid) return { success: false, error: check.error };
  }

  store.services[idx] = { ...store.services[idx], ...updates };
  return { success: true, service: getServiceById(id) };
}

function toggleServiceOpen(id) {
  const idx = store.services.findIndex((s) => s.id === Number(id));
  if (idx === -1) return { success: false, error: "Service not found." };

  store.services[idx].open = !store.services[idx].open;
  return { success: true, service: getServiceById(id) };
}

module.exports = {
  listServices,
  getServiceById,
  createService,
  updateService,
  toggleServiceOpen,
  validateService,
};
