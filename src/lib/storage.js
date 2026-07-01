/**
 * storage.js — เก็บข้อมูลใน localStorage เมื่อยังไม่ได้ตั้ง Supabase (demo mode)
 */

const KEY = "thenun:tasks";

export function loadTasks() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks) {
  localStorage.setItem(KEY, JSON.stringify(tasks));
}
