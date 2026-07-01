-- รันใน Supabase Dashboard > SQL Editor

-- ตารางงาน
create table if not exists tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  type          text not null default 'deadline',   -- 'deadline' | 'ongoing'
  status        text not null default 'pending',    -- 'pending' | 'done'
  due_date      date,
  scheduled_date date,
  scheduled_time text,
  assignee      text not null default 'me',
  project       text,
  recurrence    text not null default 'none',       -- 'none' | 'weekly' | 'monthly'
  important     boolean not null default false,
  notes         text,
  subtasks      jsonb not null default '[]',
  follow_ups    jsonb not null default '[]',
  reschedule_count  int not null default 0,
  reschedule_history jsonb not null default '[]',
  calendar_event_id text,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ตาราง Google tokens (เก็บ refresh token)
create table if not exists google_tokens (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  access_token  text,
  expires_at    bigint,
  updated_at    timestamptz not null default now()
);

-- Row Level Security: เห็นแค่ข้อมูลของตัวเอง
alter table tasks enable row level security;
alter table google_tokens enable row level security;

create policy "users_own_tasks" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_tokens" on google_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Index เร็วขึ้นเวลาดึงงานตาม user + วันที่
create index if not exists tasks_user_due on tasks (user_id, due_date);
create index if not exists tasks_user_status on tasks (user_id, status);
