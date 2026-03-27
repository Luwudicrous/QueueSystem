const queue = require("../src/modules/queue");
const store = require("../src/store");

// Reset queue and services before each test
beforeEach(() => {
  store.queues.splice(0);
  store.history.splice(2); // keep the 2 hardcoded history entries
  store.services.splice(3); // keep the 3 hardcoded services
  // Make sure Tech Support (id:1) is open and Advising (id:2) is closed
  store.services[0].open = true;
  store.services[1].open = false;
  store.services[2].open = true;
});

// Estimates the Wait time in a service via position in queue and service duration
describe("estimateWait", () => {
  test("position 1 waits 0 minutes (they are next)", () => {
    expect(queue.estimateWait(1, 15)).toBe(0);
  });

  test("position 2 waits 1 * duration", () => {
    expect(queue.estimateWait(2, 15)).toBe(15);
  });

  test("position 4 waits 3 * duration", () => {
    expect(queue.estimateWait(4, 20)).toBe(60);
  });

  test("returns 0 for position 0 or below", () => {
    expect(queue.estimateWait(0, 15)).toBe(0);
  });
});

// Joining a queue
describe("joinQueue", () => {
  test("user successfully joins an open queue", () => {
    const result = queue.joinQueue({ userId: 2, userName: "Test User", serviceId: 1 });
    expect(result.success).toBe(true);
    expect(result.entry.position).toBe(1);
    expect(result.entry.serviceName).toBe("Tech Support");
  });

  test("first user in queue has ETA equal to service duration", () => {
    const result = queue.joinQueue({ userId: 2, userName: "Test User", serviceId: 1 });
    // position 1: estimateWait(1, 15) + 15 = 0 + 15 = 15
    expect(result.entry.etaMinutes).toBe(15);
  });

  test("second user gets position 2", () => {
    queue.joinQueue({ userId: 2, userName: "User A", serviceId: 1 });
    const result = queue.joinQueue({ userId: 3, userName: "User B", serviceId: 1 });
    expect(result.success).toBe(true);
    expect(result.entry.position).toBe(2);
  });

  test("fails when service is closed", () => {
    const result = queue.joinQueue({ userId: 2, userName: "Test User", serviceId: 2 });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/closed/i);
  });

  test("fails when user is already in the queue", () => {
    queue.joinQueue({ userId: 2, userName: "Test User", serviceId: 1 });
    const again = queue.joinQueue({ userId: 2, userName: "Test User", serviceId: 1 });
    expect(again.success).toBe(false);
    expect(again.error).toMatch(/already/i);
  });

  test("fails when serviceId does not exist", () => {
    const result = queue.joinQueue({ userId: 2, userName: "Test User", serviceId: 9999 });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  test("fails when userId is missing", () => {
    const result = queue.joinQueue({ userId: null, userName: "Test User", serviceId: 1 });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/userId/i);
  });

  test("fails when userName is empty", () => {
    const result = queue.joinQueue({ userId: 2, userName: "   ", serviceId: 1 });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/userName/i);
  });

  test("triggers a notification on join", () => {
    const beforeCount = store.notifications.length;
    queue.joinQueue({ userId: 2, userName: "Test User", serviceId: 1 });
    expect(store.notifications.length).toBeGreaterThan(beforeCount);
  });
});

// Leaving the Queue
describe("leaveQueue", () => {
  test("user can leave a queue they joined", () => {
    queue.joinQueue({ userId: 2, userName: "Test User", serviceId: 1 });
    const result = queue.leaveQueue({ userId: 2, serviceId: 1 });
    expect(result.success).toBe(true);
  });

  test("leaving adds a 'Left' entry to history", () => {
    const before = store.history.length;
    queue.joinQueue({ userId: 2, userName: "Test User", serviceId: 1 });
    queue.leaveQueue({ userId: 2, serviceId: 1 });
    expect(store.history.length).toBe(before + 1);
    expect(store.history[store.history.length - 1].outcome).toBe("Left");
  });

  test("fails if user is not in the queue", () => {
    const result = queue.leaveQueue({ userId: 2, serviceId: 1 });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not in/i);
  });

  test("positions are recalculated after a user leaves", () => {
    queue.joinQueue({ userId: 2, userName: "User A", serviceId: 1 });
    queue.joinQueue({ userId: 3, userName: "User B", serviceId: 1 });
    queue.joinQueue({ userId: 4, userName: "User C", serviceId: 1 });

    queue.leaveQueue({ userId: 2, serviceId: 1 }); // remove first user

    const remaining = queue.getQueue(1);
    expect(remaining[0].position).toBe(1); // User B is now #1
    expect(remaining[1].position).toBe(2); // User C is now #2
  });
});

// Who will be serviced next
describe("serveNext", () => {
  test("serves the first user in the queue", () => {
    queue.joinQueue({ userId: 2, userName: "First", serviceId: 1 });
    queue.joinQueue({ userId: 3, userName: "Second", serviceId: 1 });
    const result = queue.serveNext(1);
    expect(result.success).toBe(true);
    expect(result.servedUser).toBe("First");
  });

  test("served user is removed from the queue", () => {
    queue.joinQueue({ userId: 2, userName: "First", serviceId: 1 });
    queue.serveNext(1);
    expect(queue.getQueue(1).length).toBe(0);
  });

  test("serving adds a 'Served' history entry", () => {
    queue.joinQueue({ userId: 2, userName: "First", serviceId: 1 });
    const before = store.history.length;
    queue.serveNext(1);
    expect(store.history.length).toBe(before + 1);
    expect(store.history[store.history.length - 1].outcome).toBe("Served");
  });

  test("fails when queue is empty", () => {
    const result = queue.serveNext(1);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/empty/i);
  });

  test("fails for non-existent service", () => {
    const result = queue.serveNext(9999);
    expect(result.success).toBe(false);
  });

  test("remaining users get updated positions after serve", () => {
    queue.joinQueue({ userId: 2, userName: "A", serviceId: 1 });
    queue.joinQueue({ userId: 3, userName: "B", serviceId: 1 });
    queue.joinQueue({ userId: 4, userName: "C", serviceId: 1 });
    queue.serveNext(1);
    const remaining = queue.getQueue(1);
    expect(remaining[0].position).toBe(1);
    expect(remaining[1].position).toBe(2);
  });
});

// User Status
describe("getUserStatus", () => {
  test("returns null when user is not in any queue", () => {
    expect(queue.getUserStatus(2)).toBeNull();
  });

  test("returns the entry after user joins", () => {
    queue.joinQueue({ userId: 2, userName: "Test User", serviceId: 1 });
    const status = queue.getUserStatus(2);
    expect(status).not.toBeNull();
    expect(status.serviceId).toBe(1);
  });

  test("returns null after user leaves", () => {
    queue.joinQueue({ userId: 2, userName: "Test User", serviceId: 1 });
    queue.leaveQueue({ userId: 2, serviceId: 1 });
    expect(queue.getUserStatus(2)).toBeNull();
  });
});
