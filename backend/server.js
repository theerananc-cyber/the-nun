import "dotenv/config";
import express from "express";
import cors from "cors";
import tasksRouter from "./routes/tasks.js";
import calendarRouter from "./routes/calendar.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/api/tasks", tasksRouter);
app.use("/api/calendar", calendarRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Backend รันอยู่ที่ http://localhost:${PORT}`));
