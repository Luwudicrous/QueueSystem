// ============================================================
//  tests/auth.test.js  –  Unit tests for Authentication Module
// ============================================================

const auth = require("../src/modules/auth");
const store = require("../src/store");

// Reset users to baseline before each test so tests don't bleed into each other
beforeEach(() => {
  // Remove any users added by tests (keep the 2 hardcoded ones)
  store.users.splice(2);
});

// ==================== validateRegistration ====================

describe("validateRegistration", () => {
  test("returns valid for correct input", () => {
    expect(
      auth.validateRegistration({ name: "Alice", email: "alice@test.com", password: "secret1" })
    ).toEqual({ valid: true });
  });

  test("rejects missing name", () => {
    const r = auth.validateRegistration({ name: "", email: "a@b.com", password: "abc123" });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/name/i);
  });

  test("rejects name over 100 characters", () => {
    const r = auth.validateRegistration({ name: "A".repeat(101), email: "a@b.com", password: "abc123" });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/100/);
  });

  test("rejects invalid email", () => {
    const r = auth.validateRegistration({ name: "Bob", email: "not-an-email", password: "abc123" });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/email/i);
  });

  test("rejects password shorter than 6 characters", () => {
    const r = auth.validateRegistration({ name: "Bob", email: "bob@test.com", password: "abc" });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/6/);
  });

  test("rejects password over 128 characters", () => {
    const r = auth.validateRegistration({ name: "Bob", email: "bob@test.com", password: "x".repeat(129) });
    expect(r.valid).toBe(false);
  });

  test("rejects missing password", () => {
    const r = auth.validateRegistration({ name: "Bob", email: "bob@test.com", password: "" });
    expect(r.valid).toBe(false);
  });
});

// ==================== register ====================

describe("register", () => {
  test("successfully registers a new user", () => {
    const result = auth.register({ name: "Alice", email: "alice@new.com", password: "password1" });
    expect(result.success).toBe(true);
    expect(result.user.email).toBe("alice@new.com");
    expect(result.user.role).toBe("user");
    expect(result.user.password).toBeUndefined(); // password must not be returned
  });

  test("new users always get 'user' role", () => {
    const result = auth.register({ name: "Alice", email: "alice2@new.com", password: "password1" });
    expect(result.user.role).toBe("user");
  });

  test("fails on duplicate email", () => {
    auth.register({ name: "Alice", email: "dup@test.com", password: "password1" });
    const second = auth.register({ name: "Alice2", email: "dup@test.com", password: "password2" });
    expect(second.success).toBe(false);
    expect(second.error).toMatch(/already/i);
  });

  test("email comparison is case-insensitive", () => {
    auth.register({ name: "Alice", email: "Case@test.com", password: "password1" });
    const second = auth.register({ name: "Alice2", email: "case@TEST.com", password: "password2" });
    expect(second.success).toBe(false);
  });

  test("fails with invalid email", () => {
    const result = auth.register({ name: "Alice", email: "bad-email", password: "password1" });
    expect(result.success).toBe(false);
  });
});

// ==================== login ====================

describe("login", () => {
  test("successfully logs in hardcoded admin", () => {
    const result = auth.login({ email: "admin@queuesmart.com", password: "admin123" });
    expect(result.success).toBe(true);
    expect(result.user.role).toBe("admin");
    expect(result.user.password).toBeUndefined();
  });

  test("successfully logs in hardcoded user", () => {
    const result = auth.login({ email: "testuser@gmail.com", password: "test123" });
    expect(result.success).toBe(true);
    expect(result.user.role).toBe("user");
  });

  test("fails with wrong password", () => {
    const result = auth.login({ email: "admin@queuesmart.com", password: "wrongpass" });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid/i);
  });

  test("fails with unknown email", () => {
    const result = auth.login({ email: "nobody@nowhere.com", password: "whatever" });
    expect(result.success).toBe(false);
  });

  test("fails with empty email", () => {
    const result = auth.login({ email: "", password: "admin123" });
    expect(result.success).toBe(false);
  });

  test("fails with empty password", () => {
    const result = auth.login({ email: "admin@queuesmart.com", password: "" });
    expect(result.success).toBe(false);
  });

  test("login is case-insensitive for email", () => {
    const result = auth.login({ email: "ADMIN@queuesmart.COM", password: "admin123" });
    expect(result.success).toBe(true);
  });
});
