const svc = require("../src/modules/services");
const store = require("../src/store");

// Reset services to the 3 hardcoded ones before each test
beforeEach(() => {
  store.services.splice(3);
});

// Validation Tests for services
describe("validateService", () => {
  const good = { name: "My Service", description: "Does stuff", duration: 15, priority: "low" };

  test("accepts valid input", () => {
    expect(svc.validateService(good)).toEqual({ valid: true });
  });

  test("rejects empty name", () => {
    const r = svc.validateService({ ...good, name: "" });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/name/i);
  });

  test("rejects name over 100 characters", () => {
    const r = svc.validateService({ ...good, name: "X".repeat(101) });
    expect(r.valid).toBe(false);
  });

  test("rejects empty description", () => {
    const r = svc.validateService({ ...good, description: "" });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/description/i);
  });

  test("rejects description over 300 characters", () => {
    const r = svc.validateService({ ...good, description: "D".repeat(301) });
    expect(r.valid).toBe(false);
  });

  test("rejects non-positive duration", () => {
    const r = svc.validateService({ ...good, duration: 0 });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/duration/i);
  });

  test("rejects duration over 480", () => {
    const r = svc.validateService({ ...good, duration: 481 });
    expect(r.valid).toBe(false);
  });

  test("rejects invalid priority", () => {
    const r = svc.validateService({ ...good, priority: "urgent" });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/priority/i);
  });

  test("accepts all three valid priorities", () => {
    ["low", "medium", "high"].forEach((p) => {
      expect(svc.validateService({ ...good, priority: p }).valid).toBe(true);
    });
  });
});

// Service lists and details
describe("listServices", () => {
  test("returns all 3 hardcoded services", () => {
    expect(svc.listServices().length).toBe(3);
  });

  test("each service has a queueLength field", () => {
    svc.listServices().forEach((s) => {
      expect(s).toHaveProperty("queueLength");
    });
  });
});

describe("getServiceById", () => {
  test("finds an existing service", () => {
    const s = svc.getServiceById(1);
    expect(s).not.toBeNull();
    expect(s.name).toBe("Tech Support");
  });

  test("returns null for unknown id", () => {
    expect(svc.getServiceById(9999)).toBeNull();
  });
});

describe("createService", () => {     // Service creation
  test("creates a valid service", () => {
    const result = svc.createService({
      name: "Counselling",
      description: "Mental wellness support",
      duration: 45,
      priority: "high",
    });
    expect(result.success).toBe(true);
    expect(result.service.id).toBeDefined();
    expect(result.service.open).toBe(true);
  });

  test("rejects invalid service data", () => {
    const result = svc.createService({ name: "", description: "x", duration: 10, priority: "low" });
    expect(result.success).toBe(false);
  });

  test("new services appear in listServices", () => {
    svc.createService({ name: "New One", description: "desc", duration: 10, priority: "low" });
    expect(svc.listServices().length).toBe(4);
  });
});

describe("toggleServiceOpen", () => {
  test("toggles open → closed", () => {
    const before = svc.getServiceById(1).open;  // Tech Support is open
    const result = svc.toggleServiceOpen(1);
    expect(result.success).toBe(true);
    expect(result.service.open).toBe(!before);
  });

  test("returns error for unknown service", () => {
    const result = svc.toggleServiceOpen(9999);
    expect(result.success).toBe(false);
  });
});
