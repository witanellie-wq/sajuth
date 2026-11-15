-- 로그인(LINE/Google) + 내 기록 + 상담 채팅. Supabase SQL editor에서 1회 실행.
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_sub text not null,
  name text,
  picture text,
  email text,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  unique (provider, provider_sub)
);

create table if not exists user_items (
  user_id uuid not null references app_users(id) on delete cascade,
  kind text not null check (kind in ('reading','compat')),
  item_id uuid not null,
  label text,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);

create table if not exists chat_threads (
  kind text not null check (kind in ('reading','compat')),
  item_id uuid not null,
  bought int not null default 0,
  used int not null default 0,
  primary key (kind, item_id)
);

create table if not exists chat_messages (
  id bigint generated always as identity primary key,
  kind text not null,
  item_id uuid not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_item on chat_messages (kind, item_id, created_at);

create table if not exists chat_purchases (
  id bigint generated always as identity primary key,
  kind text not null,
  item_id uuid not null,
  pack text not null,
  ref text not null unique,
  status text not null check (status in ('paid','pending')),
  note text,
  created_at timestamptz not null default now()
);

-- 서버(service key)만 접근 — 익명 접근 차단
alter table app_users enable row level security;
alter table user_items enable row level security;
alter table chat_threads enable row level security;
alter table chat_messages enable row level security;
alter table chat_purchases enable row level security;
