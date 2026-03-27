const store = require("../store");

// Authentication and Registration Logic
function validateRegistration({ name, email, password }) {
  if (!name || typeof name !== "string" || name.trim().length === 0)
    return { valid: false, error: "Name is required." };
  if (name.trim().length > 100)
    return { valid: false, error: "Name must be 100 characters or fewer." };

  if (!email || typeof email !== "string")
    return { valid: false, error: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { valid: false, error: "Invalid email address." };

  if (!password || typeof password !== "string")
    return { valid: false, error: "Password is required." };
  if (password.length < 6)
    return { valid: false, error: "Password must be at least 6 characters." };
  if (password.length > 128)
    return { valid: false, error: "Password must be 128 characters or fewer." };

  return { valid: true };
}

// Validates login input
function validateLogin({ email, password }) {
  if (!email || typeof email !== "string" || email.trim().length === 0)
    return { valid: false, error: "Email is required." };
  if (!password || typeof password !== "string" || password.trim().length === 0)
    return { valid: false, error: "Password is required." };
  return { valid: true };
}

// For Business Logic
function register({ name, email, password }) {
  const check = validateRegistration({ name, email, password });
  if (!check.valid) return { success: false, error: check.error };

  const normalizedEmail = email.trim().toLowerCase();

  // Duplicate email check
  const existing = store.users.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );
  if (existing) return { success: false, error: "Email already registered." };

  const newUser = {
    id: store.newUserId(),
    name: name.trim(),
    email: normalizedEmail,
    password,          // no hashing required for this assignment
    role: "user",      // all self-registered users get "user" role
  };

  store.users.push(newUser);

  // Returns user without password
  const { password: _omit, ...safeUser } = newUser;
  return { success: true, user: safeUser };
}

// for Existing Users to Login
function login({ email, password }) {
  const check = validateLogin({ email, password });
  if (!check.valid) return { success: false, error: check.error };

  const found = store.users.find(
    (u) =>
      u.email.toLowerCase() === email.trim().toLowerCase() &&
      u.password === password
  );

  if (!found) return { success: false, error: "Invalid email or password." };

  const { password: _omit, ...safeUser } = found;
  return { success: true, user: safeUser };
}

module.exports = { register, login, validateRegistration, validateLogin };
