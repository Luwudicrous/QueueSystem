// ============================================================
//  modules/history.js  –  History Module
//  Tracks queue participation outcomes per user.
// ============================================================

const store = require("../store");

/**
 * Get history for a specific user (most recent first).
 */
function getUserHistory(userId) {
  return store.history
    .filter((h) => h.userId === userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Get full history (admin use).
 */
function getAllHistory() {
  return [...store.history].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
}

module.exports = { getUserHistory, getAllHistory };
