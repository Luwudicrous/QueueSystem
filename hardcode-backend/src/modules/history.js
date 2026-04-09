const store = require("../store");

// Gets the history of each user.
function getUserHistory(userId) {
  return store.history
    // Filters by most recent first
    .filter((h) => h.userId === userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Gets the full history of users (Admin use)
function getAllHistory() {
  return [...store.history].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
}

module.exports = { getUserHistory, getAllHistory };
