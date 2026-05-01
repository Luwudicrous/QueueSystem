const request = require("supertest");
const app = require("../server");

let adminToken = "";
let userToken  = "";

describe("POST /api/auth/login", () => {
  test("admin login returns token with role admin", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: "admin@queuesmart.com", password: "admin123" });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe("admin");
    adminToken = res.body.token;
  });

  test("user login returns token with role user", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: "testuser@gmail.com", password: "test123" });
    expect(res.statusCode).toBe(200);
    expect(res.body.role).toBe("user");
    userToken = res.body.token;
  });

  test("wrong password returns 401", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: "admin@queuesmart.com", password: "wrongpass" });
    expect(res.statusCode).toBe(401);
  });

  test("missing email returns 400", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ password: "admin123" });
    expect(res.statusCode).toBe(400);
  });

  test("invalid email format returns 400", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: "notanemail", password: "admin123" });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/auth/register", () => {
  test("short password returns 400", async () => {
    const res = await request(app).post("/api/auth/register")
      .send({ name: "Test", email: "short@test.com", password: "123" });
    expect(res.statusCode).toBe(400);
  });

  test("missing name returns 400", async () => {
    const res = await request(app).post("/api/auth/register")
      .send({ email: "noname@test.com", password: "password123" });
    expect(res.statusCode).toBe(400);
  });

  test("invalid email returns 400", async () => {
    const res = await request(app).post("/api/auth/register")
      .send({ name: "Test", email: "bademail", password: "password123" });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/services", () => {
  test("authenticated user can get services", async () => {
    const res = await request(app).get("/api/services")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("unauthenticated request returns 401", async () => {
    const res = await request(app).get("/api/services");
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /api/services", () => {
  test("user cannot create a service", async () => {
    const res = await request(app).post("/api/services")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Bad Service", description: "test", duration: 5, priority: "low" });
    expect(res.statusCode).toBe(403);
  });

  test("missing name returns 400", async () => {
    const res = await request(app).post("/api/services")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "no name", duration: 10, priority: "low" });
    expect(res.statusCode).toBe(400);
  });

  test("invalid priority returns 400", async () => {
    const res = await request(app).post("/api/services")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Bad Priority", description: "test", duration: 10, priority: "urgent" });
    expect(res.statusCode).toBe(400);
  });

  test("negative duration returns 400", async () => {
    const res = await request(app).post("/api/services")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Neg Duration", description: "test", duration: -5, priority: "low" });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/queue/join", () => {
  test("missing serviceId returns 400", async () => {
    const res = await request(app).post("/api/queue/join")
      .set("Authorization", `Bearer ${userToken}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  test("joining nonexistent service returns 404", async () => {
    const res = await request(app).post("/api/queue/join")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ serviceId: 99999 });
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /api/queue/serve/:serviceId", () => {
  test("non-admin cannot serve", async () => {
    const res = await request(app).post("/api/queue/1/serve-next")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("admin can attempt serve", async () => {
    const res = await request(app).post("/api/queue/1/serve-next")
      .set("Authorization", `Bearer ${adminToken}`);
    expect([200, 400, 404]).toContain(res.statusCode);
  });
});

describe("GET /api/notifications/:userId", () => {
  test("user can get their notifications", async () => {
    const res = await request(app).get("/api/notifications/2")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("unauthenticated request returns 401", async () => {
    const res = await request(app).get("/api/notifications/2");
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/history/:userId", () => {
  test("user can get their history", async () => {
    const res = await request(app).get("/api/history/2")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("unauthenticated request returns 401", async () => {
    const res = await request(app).get("/api/history/2");
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/reports/summary", () => {
  test("admin can get summary report", async () => {
    const res = await request(app).get("/api/reports/summary")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("total_users");
    expect(res.body).toHaveProperty("total_served");
    expect(res.body).toHaveProperty("average_wait_minutes");
  });

  test("user cannot access reports", async () => {
    const res = await request(app).get("/api/reports/summary")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  test("unauthenticated request returns 401", async () => {
    const res = await request(app).get("/api/reports/summary");
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/reports/users", () => {
  test("admin can get user participation report", async () => {
    const res = await request(app).get("/api/reports/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("user cannot access user report", async () => {
    const res = await request(app).get("/api/reports/users")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });
});

describe("GET /api/reports/services", () => {
  test("admin can get service activity report", async () => {
    const res = await request(app).get("/api/reports/services")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/reports/history", () => {
  test("admin can get history report", async () => {
    const res = await request(app).get("/api/reports/history")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("admin can filter history by serviceId", async () => {
    const res = await request(app).get("/api/reports/history?serviceId=1")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("admin can filter history by date range", async () => {
    const res = await request(app).get("/api/reports/history?from=2026-01-01&to=2026-12-31")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/smart/recommend/:serviceId", () => {
  test("returns recommendation for valid service", async () => {
    const res = await request(app).get("/api/smart/recommend/1")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("selected_service");
    expect(res.body).toHaveProperty("alternatives");
    expect(res.body).toHaveProperty("has_alternatives");
  });

  test("returns 404 for nonexistent service", async () => {
    const res = await request(app).get("/api/smart/recommend/99999")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(404);
  });

  test("unauthenticated request returns 401", async () => {
    const res = await request(app).get("/api/smart/recommend/1");
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/smart/best-time/:serviceId", () => {
  test("returns best time suggestion for valid service", async () => {
    const res = await request(app).get("/api/smart/best-time/1")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("suggestion");
  });

  test("returns 404 for nonexistent service", async () => {
    const res = await request(app).get("/api/smart/best-time/99999")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(404);
  });
});
