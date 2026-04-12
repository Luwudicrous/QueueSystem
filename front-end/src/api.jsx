const BASE = 'http://localhost:5000/api';
 
const token = () => localStorage.getItem('token');
const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token()}`,
});
 
// Authentication
export const login = (email, password) =>
  fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(r => r.json());
 
export const register = (name, email, password) =>
  fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  }).then(r => r.json());
 
// Services
export const getServices = () =>
  fetch(`${BASE}/services`, { headers: headers() }).then(r => r.json());
 
export const createService = (data) =>
  fetch(`${BASE}/services`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  }).then(r => r.json());
 
export const toggleService = (id) =>
  fetch(`${BASE}/services/${id}/toggle`, {
    method: 'PATCH',
    headers: headers(),
  }).then(r => r.json());
 
// Queues
export const getMyQueue = () =>
  fetch(`${BASE}/queue/status/${JSON.parse(atob(token().split('.')[1])).id}`, {
    headers: headers(),
  }).then(r => r.json());
 
export const getServiceQueue = (serviceId) =>
  fetch(`${BASE}/queue/${serviceId}`, { headers: headers() }).then(r => r.json());
 
export const joinQueue = (serviceId) =>
  fetch(`${BASE}/queue/join`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ serviceId }),
  }).then(r => r.json());
 
export const leaveQueue = () =>
  fetch(`${BASE}/queue/leave`, {
    method: 'POST',
    headers: headers(),
  }).then(r => r.json());
 
export const serveNext = (serviceId) =>
  fetch(`${BASE}/queue/${serviceId}/serve-next`, {
    method: 'POST',
    headers: headers(),
  }).then(r => r.json());
 
// Notifications
export const getNotifications = () => {
  const id = JSON.parse(atob(token().split('.')[1])).id;
  return fetch(`${BASE}/notifications/${id}`, { headers: headers() }).then(r => r.json());
};
 
// History tokens
export const getHistory = () => {
  const id = JSON.parse(atob(token().split('.')[1])).id;
  return fetch(`${BASE}/history/${id}`, { headers: headers() }).then(r => r.json());
};