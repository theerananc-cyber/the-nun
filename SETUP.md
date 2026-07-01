# เริ่มต้นใช้งาน เรดาร์งาน

## ขั้นตอนที่ 1 — ตั้ง Supabase
1. ไปที่ https://supabase.com → สร้างโปรเจกต์ใหม่
2. ไปที่ **SQL Editor** → วางโค้ดจาก `supabase-schema.sql` แล้วรัน
3. ไปที่ **Project Settings > API** → คัดลอก `Project URL` และ `anon public` key

## ขั้นตอนที่ 2 — ตั้ง Google Calendar API
1. ไปที่ https://console.cloud.google.com → สร้างโปรเจกต์ใหม่
2. ไปที่ **APIs & Services > Enable APIs** → เปิด "Google Calendar API"
3. ไปที่ **APIs & Services > Credentials > Create Credentials > OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3001/api/calendar/oauth-callback`
4. คัดลอก Client ID และ Client Secret

## ขั้นตอนที่ 3 — ตั้งค่า .env

**Frontend** — คัดลอก `.env.example` เป็น `.env`:
```
VITE_SUPABASE_URL=<Project URL จาก Supabase>
VITE_SUPABASE_ANON_KEY=<anon key จาก Supabase>
```

**Backend** — คัดลอก `backend/.env.example` เป็น `backend/.env`:
```
SUPABASE_URL=<Project URL จาก Supabase>
SUPABASE_SERVICE_KEY=<service_role key จาก Supabase>
GOOGLE_CLIENT_ID=<จาก Google Cloud>
GOOGLE_CLIENT_SECRET=<จาก Google Cloud>
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/oauth-callback
FRONTEND_URL=http://localhost:5173
```

## ขั้นตอนที่ 4 — รันแอป

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd ..  (root ของโปรเจกต์)
npm install
npm run dev
```

เปิด http://localhost:5173 — เข้าสู่ระบบด้วย Magic Link (อีเมล) แล้วใช้งานได้เลย

## Deploy (ทำตอนหลังได้)
- **Frontend**: push ไป GitHub → เชื่อม Vercel → ใส่ env vars ใน Vercel dashboard
- **Backend**: deploy ไป Render/Railway → ใส่ env vars → อัปเดต GOOGLE_REDIRECT_URI และ FRONTEND_URL ให้ตรงกับ production URL
