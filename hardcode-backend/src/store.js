// Data is stored here for the fake hardcoded backend.

// Users for login and their password
const users = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@queuesmart.com",
    password: "admin123",   // plain-text OK for this assignment
    role: "admin",
  },
  {
    id: 2,
    name: "Test User",
    email: "testuser@gmail.com",
    password: "test123",
    role: "user",
  },
];

// Services offered
const services = [
  {
    id: 1,
    name: "Tech Support",
    description: "Fix device issues",
    duration: 15,         // minutes per person
    priority: "high",
    open: true,
  },
  {
    id: 2,
    name: "Advising",
    description: "Student academic help",
    duration: 30,
    priority: "medium",
    open: false,
  },
  {
    id: 3,
    name: "Financial Aid",
    description: "Scholarships and account questions",
    duration: 20,
    priority: "low",
    open: true,
  },
];

// Queue entries (one queue entry per user-in-service)
// { id, serviceId, userId, userName, joinedAt, status }
const queues = [];

// Logging Notifications
const notifications = [];

// History logs
const history = [
  {
    id: 101,
    userId: 2,
    date: "2026-02-10",
    serviceName: "Tech Support",
    outcome: "Served",
  },
  {
    id: 102,
    userId: 2,
    date: "2026-02-12",
    serviceName: "Advising",
    outcome: "Left",
  },
];

// Generates Simple IDs for new entries
let nextUserId = 3;
let nextServiceId = 4;
let nextQueueId = 1;
let nextNotifId = 1;
let nextHistoryId = 200;

const newUserId      = () => nextUserId++;
const newServiceId   = () => nextServiceId++;
const newQueueId     = () => nextQueueId++;
const newNotifId     = () => nextNotifId++;
const newHistoryId   = () => nextHistoryId++;

module.exports = {
  users,
  services,
  queues,
  notifications,
  history,
  newUserId,
  newServiceId,
  newQueueId,
  newNotifId,
  newHistoryId,
};
