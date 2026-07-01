import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/tasks — ดึงงานทั้งหมดของ user
router.get("/", async (req, res) => {
  const { data, error } = await req.supabase
    .from("tasks")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/tasks — สร้างงานใหม่
router.post("/", async (req, res) => {
  const { data, error } = await req.supabase
    .from("tasks")
    .insert({ ...req.body, user_id: req.user.id })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/tasks/:id — แก้ไขงาน
router.patch("/:id", async (req, res) => {
  const { data, error } = await req.supabase
    .from("tasks")
    .update(req.body)
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/tasks/:id — ลบงาน
router.delete("/:id", async (req, res) => {
  const { error } = await req.supabase
    .from("tasks")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
