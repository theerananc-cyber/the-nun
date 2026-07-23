import { supabase, DEMO_MODE } from "./supabase.js";

const LOCAL_KEY = "thenun:tasks";
const PROJ_KEY  = "thenun:projects";

// ── localStorage fallback ────────────────────────────────────────────────────
export function loadTasks() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveTasks(tasks) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(tasks));
}

// ── Supabase helpers ─────────────────────────────────────────────────────────
export async function loadTasksFromDB() {
  if (DEMO_MODE) return loadTasks();
  const { data, error } = await supabase.from("tasks").select("id, data");
  if (error) { console.error(error); return loadTasks(); }
  return data.map(r => r.data);
}

export async function saveTaskToDB(task) {
  if (DEMO_MODE) return;
  await supabase.from("tasks").upsert({ id: task.id, data: task });
}

export async function deleteTaskFromDB(id) {
  if (DEMO_MODE) return;
  await supabase.from("tasks").delete().eq("id", id);
}

export async function loadProjectsFromDB() {
  if (DEMO_MODE) {
    try { return JSON.parse(localStorage.getItem(PROJ_KEY) || "[]"); } catch { return []; }
  }
  const { data, error } = await supabase.from("projects").select("id, data");
  if (error) { console.error(error); return []; }
  return data.map(r => r.data);
}

export async function saveProjectToDB(project) {
  if (DEMO_MODE) return;
  await supabase.from("projects").upsert({ id: project.id, data: project });
}

export async function deleteProjectFromDB(id) {
  if (DEMO_MODE) return;
  await supabase.from("projects").delete().eq("id", id);
}

const NOTES_KEY = "thenun:notes";
export async function loadNotesFromDB() {
  if (DEMO_MODE) { try{return JSON.parse(localStorage.getItem(NOTES_KEY)||'[]');}catch{return[];} }
  const { data, error } = await supabase.from("notes").select("id, data");
  if (error) { console.error(error); try{return JSON.parse(localStorage.getItem(NOTES_KEY)||'[]');}catch{return[];} }
  return data.map(r => r.data);
}
export async function saveNoteToDB(note) {
  if (DEMO_MODE) return;
  await supabase.from("notes").upsert({ id: note.id, data: note });
}
export async function deleteNoteFromDB(id) {
  if (DEMO_MODE) return;
  await supabase.from("notes").delete().eq("id", id);
}
