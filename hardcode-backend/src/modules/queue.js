// ============================================================
//  modules/queue.js  –  Queue Management + Wait-Time Estimation
//  Handles: join, leave, serve next, view queue, ETA calc
// ============================================================

const store = require("../store");
const notifModule = require("./notifications");

// ---------- Wait-time estimation ----------

// Estimate how long a user at `position` (1-based) will wait given a service's expected duration per person.
// Formula: (position - 1) * duration   (they wait for everyone ahead)
function estimateWait(position, durationMinutes) {
  if (position <= 0) return 0;
  return (position - 1) * durationMinutes;
}

function getQueue(serviceId) {
  const sid = Number(serviceId);
  return store.queues
  // Get the current (live) queue for a service, sorted by join time. Only includes entries with status "waiting".
    .filter((q) => q.serviceId === sid && q.status === "waiting")
    .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
}

// For joining a queue
function joinQueue({ userId, userName, serviceId }) {
  const sid = Number(serviceId);

  // Validate inputs
  if (!userId) return { success: false, error: "userId is required." };
  if (!userName || typeof userName !== "string" || userName.trim().length === 0)
    return { success: false, error: "userName is required." };
  if (!sid) return { success: false, error: "serviceId is required." };

  // Service must exist and be open
  const service = store.services.find((s) => s.id === sid);
  if (!service) return { success: false, error: "Service not found." };
  if (!service.open) return { success: false, error: "This service is currently closed." };

  // User must not already be in this queue
  const alreadyIn = store.queues.find(
    (q) => q.userId === userId && q.serviceId === sid && q.status === "waiting"
  );
  if (alreadyIn) return { success: false, error: "You are already in this queue." };

  const currentQueue = getQueue(sid);
  const position = currentQueue.length + 1;
  const eta = estimateWait(position, service.duration) + service.duration;

  const entry = {
    id: store.newQueueId(),
    serviceId: sid,
    serviceName: service.name,
    userId,
    userName: userName.trim(),
    joinedAt: new Date().toISOString(),
    status: "waiting",
    position,
    etaMinutes: eta,
  };

  store.queues.push(entry);

  // Trigger join notification
  notifModule.triggerNotification({
    userId,
    type: "joined",
    message: `You joined the ${service.name} queue. You are #${position}. Estimated wait: ${eta} min.`,
  });

  return { success: true, entry };
}

// Leaving a queue
function leaveQueue({ userId, serviceId }) {
  const sid = Number(serviceId);
  const idx = store.queues.findIndex(
    (q) => q.userId === userId && q.serviceId === sid && q.status === "waiting"
  );
  if (idx === -1)
    return { success: false, error: "You are not in this queue." };

  const entry = store.queues[idx];

  // Log to history
  store.history.push({
    id: store.newHistoryId(),
    userId,
    date: new Date().toISOString().slice(0, 10),
    serviceName: entry.serviceName,
    outcome: "Left",
  });

  // Remove from queue
  store.queues.splice(idx, 1);

  // Recalculate positions for remaining entries
  _recalcPositions(sid);

  return { success: true };
}

// Serve next user (admin action). Removes the first person in the queue and records them as Served.
function serveNext(serviceId) {
  const sid = Number(serviceId);
  const service = store.services.find((s) => s.id === sid);
  if (!service) return { success: false, error: "Service not found." };

  const currentQueue = getQueue(sid);
  if (currentQueue.length === 0)
    return { success: false, error: "Queue is empty." };

  const nextEntry = currentQueue[0];
  const idx = store.queues.findIndex((q) => q.id === nextEntry.id);

  // Log to history
  store.history.push({
    id: store.newHistoryId(),
    userId: nextEntry.userId,
    date: new Date().toISOString().slice(0, 10),
    serviceName: service.name,
    outcome: "Served",
  });

  // Remove from active queue
  store.queues.splice(idx, 1);

  // Recalculate positions and check "almost ready" threshold
  _recalcPositions(sid);
  _checkAlmostReady(sid, service);

  return { success: true, servedUser: nextEntry.userName };
}

// Current User status
function getUserStatus(userId) {
  const entry = store.queues.find(
    (q) => q.userId === userId && q.status === "waiting"
  );
  if (!entry) return null;
  return { ...entry };
}

// Helper to recalculate positions and ETAs after a change in the queue
function _recalcPositions(serviceId) {
  const ordered = getQueue(serviceId);
  const service = store.services.find((s) => s.id === serviceId);
  if (!service) return;

  ordered.forEach((entry, i) => {
    const storeIdx = store.queues.findIndex((q) => q.id === entry.id);
    if (storeIdx !== -1) {
      store.queues[storeIdx].position = i + 1;
      store.queues[storeIdx].etaMinutes =
        estimateWait(i + 1, service.duration) + service.duration;
    }
  });
}

function _checkAlmostReady(serviceId, service) {
  const ordered = getQueue(serviceId);
  // Notify anyone who is now position 1 or 2
  ordered.slice(0, 2).forEach((entry) => {
    notifModule.triggerNotification({
      userId: entry.userId,
      type: "almost_ready",
      message: `You are almost up! You are now #${entry.position} in the ${service.name} queue.`,
    });
  });
}

module.exports = {
  getQueue,
  joinQueue,
  leaveQueue,
  serveNext,
  getUserStatus,
  estimateWait,
};
