const notif = require("../src/modules/notifications");
const history = require("../src/modules/history");
const store = require("../src/store");

beforeEach(() => {
  store.notifications.splice(0);
  store.history.splice(2); // keep the 2 hardcoded history entries
});


// Notifications Tests
describe("triggerNotification", () => {
  test("stores a notification in the store", () => {
    notif.triggerNotification({ userId: 2, type: "joined", message: "You joined!" });
    expect(store.notifications.length).toBe(1);
  });

  test("returned notification has correct fields", () => {
    const n = notif.triggerNotification({ userId: 2, type: "joined", message: "Hello" });
    expect(n).toMatchObject({ userId: 2, type: "joined", message: "Hello", read: false });
    expect(n.id).toBeDefined();
    expect(n.createdAt).toBeDefined();
  });

  test("multiple notifications are stored independently", () => {
    notif.triggerNotification({ userId: 2, type: "joined", message: "A" });
    notif.triggerNotification({ userId: 2, type: "almost_ready", message: "B" });
    expect(store.notifications.length).toBe(2);
  });
});

describe("getNotifications", () => {
  test("returns notifications only for the requested user", () => {
    notif.triggerNotification({ userId: 2, type: "joined", message: "For user 2" });
    notif.triggerNotification({ userId: 3, type: "joined", message: "For user 3" });
    const result = notif.getNotifications(2);
    expect(result.length).toBe(1);
    expect(result[0].userId).toBe(2);
  });

  test("returns empty array when user has no notifications", () => {
    expect(notif.getNotifications(99)).toEqual([]);
  });

  test("returns most recent notification first", () => {
    notif.triggerNotification({ userId: 2, type: "joined", message: "First" });
    notif.triggerNotification({ userId: 2, type: "almost_ready", message: "Second" });
    const result = notif.getNotifications(2);
    expect(result[0].message).toBe("Second");
  });
});

describe("markRead", () => {
  test("marks a single notification as read", () => {
    const n = notif.triggerNotification({ userId: 2, type: "joined", message: "Hi" });
    notif.markRead(n.id);
    const updated = store.notifications.find((x) => x.id === n.id);
    expect(updated.read).toBe(true);
  });

  test("returns error for unknown notification id", () => {
    const result = notif.markRead(9999);
    expect(result.success).toBe(false);
  });
});

describe("markAllRead", () => {
  test("marks all notifications for a user as read", () => {
    notif.triggerNotification({ userId: 2, type: "joined", message: "A" });
    notif.triggerNotification({ userId: 2, type: "almost_ready", message: "B" });
    notif.markAllRead(2);
    const userNotifs = store.notifications.filter((n) => n.userId === 2);
    expect(userNotifs.every((n) => n.read)).toBe(true);
  });

  test("does not affect notifications for other users", () => {
    notif.triggerNotification({ userId: 2, type: "joined", message: "A" });
    notif.triggerNotification({ userId: 3, type: "joined", message: "B" });
    notif.markAllRead(2);
    const otherNotifs = store.notifications.filter((n) => n.userId === 3);
    expect(otherNotifs.every((n) => n.read)).toBe(false);
  });
});

describe("getUserHistory", () => {
  test("returns history for a specific user", () => {
    const h = history.getUserHistory(2);
    expect(h.length).toBeGreaterThan(0);
    h.forEach((entry) => expect(entry.userId).toBe(2));
  });

  test("returns empty array for user with no history", () => {
    expect(history.getUserHistory(99)).toEqual([]);
  });

  test("entries are sorted most recent first", () => {
    const h = history.getUserHistory(2);
    if (h.length > 1) {
      expect(new Date(h[0].date) >= new Date(h[1].date)).toBe(true);
    }
  });
});

describe("getAllHistory", () => {
  test("returns all history entries", () => {
    const all = history.getAllHistory();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });
});
