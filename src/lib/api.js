/**
 * api.js — แทนที่ window.storage.get/set ของ Claude sandbox
 * ทุก call ส่ง Authorization: Bearer <supabase session token> ไปด้วย
 */

import { supabase } from "./supabase.js";

const BASE = import.meta.env.VITE_API_URL || "/api";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Tasks ────────────────────────────────────────────────────────────────────
export const getTasks = () => request("GET", "/tasks");
export const createTask = (task) => request("POST", "/tasks", task);
export const updateTask = (id, patch) => request("PATCH", `/tasks/${id}`, patch);
export const deleteTask = (id) => request("DELETE", `/tasks/${id}`);

// ── Google Calendar ──────────────────────────────────────────────────────────
export const getCalendarStatus = () => request("GET", "/calendar/status");
export const syncTaskToCalendar = (taskId) => request("POST", `/calendar/sync/${taskId}`);
export const getCalendarEvents = (date) => request("GET", `/calendar/events?date=${date}`);
export const disconnectCalendar = () => request("DELETE", "/calendar/token");
