const store = require("../store");

// Makes a trigger for the notifications to get called by user actions
function triggerNotification({ userId, type, message }) {
  const notif = {
    id: store.newNotifId(),
    userId,
    type,         // "joined" | "almost_ready" | "served"
    message,
    createdAt: new Date().toISOString(),
    read: false,
  };
  store.notifications.push(notif);
  return notif;
}

// Gets the unread notifications for a user
function getNotifications(userId) {
  return store.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.id - a.id);
}

function markRead(notifId) {
  // Marks a notification as read by its ID
  const idx = store.notifications.findIndex((n) => n.id === Number(notifId));
  if (idx === -1) return { success: false, error: "Notification not found." };
  store.notifications[idx].read = true;
  return { success: true };
}

// Marks notifications for a user to read.
function markAllRead(userId) {
  store.notifications
    // Sorted by most recent first, but it doesn't matter for marking read
    .filter((n) => n.userId === userId)
    .forEach((n) => (n.read = true));
  return { success: true };
}

module.exports = { triggerNotification, getNotifications, markRead, markAllRead };
