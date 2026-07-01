/**
 * Google Calendar OAuth flow:
 * 1. GET  /api/calendar/auth-url     → redirect user ไป Google consent
 * 2. GET  /api/calendar/oauth-callback → Google redirect กลับมาพร้อม code
 * 3. GET  /api/calendar/status       → ตรวจว่า user เชื่อมปฏิทินแล้วหรือยัง
 * 4. POST /api/calendar/sync/:taskId → สร้าง event + reminder ใน Google Calendar
 * 5. GET  /api/calendar/events       → ดึง events ของวันที่กำหนด
 * 6. DELETE /api/calendar/token      → ยกเลิกการเชื่อมต่อ
 */

import { Router } from "express";
import { google } from "googleapis";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// ── Auth URL (ไม่ต้องล็อกอินก่อน — redirect จาก frontend) ──────────────────
router.get("/auth-url", requireAuth, (req, res) => {
  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    // ส่ง user_id ผ่าน state เพื่อใช้ใน callback
    state: req.user.id,
  });
  res.json({ url });
});

// ── OAuth Callback (Google redirect มาที่นี่) ────────────────────────────────
router.get("/oauth-callback", async (req, res) => {
  const { code, state: userId } = req.query;
  if (!code || !userId) return res.status(400).send("Invalid callback");

  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  // เก็บ refresh token แบบเข้ารหัสใน Supabase (ใช้ service key เพราะไม่มี session ในนี้)
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  await supabase
    .from("google_tokens")
    .upsert({ user_id: userId, refresh_token: tokens.refresh_token, access_token: tokens.access_token, expires_at: tokens.expiry_date }, { onConflict: "user_id" });

  res.redirect(`${process.env.FRONTEND_URL}?calendar_connected=1`);
});

// ── ฟังก์ชันช่วย: ดึง authenticated oauth2client จาก DB ──────────────────────
async function getAuthedClient(supabase, userId) {
  const { data } = await supabase.from("google_tokens").select("*").eq("user_id", userId).single();
  if (!data) throw new Error("ยังไม่ได้เชื่อม Google Calendar");

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: data.refresh_token, access_token: data.access_token, expiry_date: data.expires_at });

  // Auto-refresh ถ้า token หมดอายุ
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.access_token) {
      await supabase.from("google_tokens").update({ access_token: tokens.access_token, expires_at: tokens.expiry_date }).eq("user_id", userId);
    }
  });

  return oauth2Client;
}

// ── Status ────────────────────────────────────────────────────────────────────
router.get("/status", requireAuth, async (req, res) => {
  const { data } = await req.supabase.from("google_tokens").select("user_id").eq("user_id", req.user.id).single();
  res.json({ connected: !!data });
});

// ── Sync task → Google Calendar ───────────────────────────────────────────────
router.post("/sync/:taskId", requireAuth, async (req, res) => {
  const { data: task } = await req.supabase.from("tasks").select("*").eq("id", req.params.taskId).eq("user_id", req.user.id).single();
  if (!task) return res.status(404).json({ error: "Task not found" });
  if (!task.due_date) return res.status(400).json({ error: "Task has no due date" });

  const oauth2Client = await getAuthedClient(req.supabase, req.user.id);
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const startDate = task.scheduled_time
    ? new Date(`${task.due_date}T${task.scheduled_time}`)
    : new Date(`${task.due_date}T09:00:00`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 ชั่วโมง

  const event = {
    summary: task.title,
    description: task.notes || "",
    start: task.scheduled_time
      ? { dateTime: startDate.toISOString(), timeZone: "Asia/Bangkok" }
      : { date: task.due_date },
    end: task.scheduled_time
      ? { dateTime: endDate.toISOString(), timeZone: "Asia/Bangkok" }
      : { date: task.due_date },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 },
        { method: "email", minutes: 1440 }, // 1 วันก่อน
      ],
    },
  };

  const { data: createdEvent } = await calendar.events.insert({ calendarId: "primary", resource: event });

  await req.supabase.from("tasks").update({ calendar_event_id: createdEvent.id }).eq("id", task.id);
  res.json({ eventId: createdEvent.id, htmlLink: createdEvent.htmlLink });
});

// ── Get events ────────────────────────────────────────────────────────────────
router.get("/events", requireAuth, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split("T")[0];
  const oauth2Client = await getAuthedClient(req.supabase, req.user.id).catch(() => null);
  if (!oauth2Client) return res.json([]);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const timeMin = new Date(`${date}T00:00:00+07:00`).toISOString();
  const timeMax = new Date(`${date}T23:59:59+07:00`).toISOString();

  const { data } = await calendar.events.list({ calendarId: "primary", timeMin, timeMax, singleEvents: true, orderBy: "startTime" });
  res.json(data.items || []);
});

// ── Disconnect ────────────────────────────────────────────────────────────────
router.delete("/token", requireAuth, async (req, res) => {
  await req.supabase.from("google_tokens").delete().eq("user_id", req.user.id);
  res.status(204).end();
});

export default router;
