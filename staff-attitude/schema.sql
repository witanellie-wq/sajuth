-- ═══════════════════════════════════════════════════════════════════════════
--  HANAHAYAN · 직원 근태 · 업무태도 · 급여 관리
--  Supabase schema (staff_ 접두어 — 예약 사이트 테이블과 분리)
--
--  ▸ Supabase Dashboard → SQL Editor → New query → 전체 붙여넣기 → Run
--  ▸ 여러 번 실행해도 안전합니다 (idempotent)
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ───────────────────────────────────────────────────────────────────────────
-- 0. 관리자 판별 함수
--    ⚠ 아래 이메일을 실제로 만들 관리자 계정 이메일로 바꾸세요.
--      (config.js 의 adminEmail 과 반드시 같아야 합니다)
-- ───────────────────────────────────────────────────────────────────────────
create or replace function staff_is_admin() returns boolean
language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = lower('admin@hanahayan.co.th');
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. 직원 명단 (staff_members)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.staff_members (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,                 -- 이름 (한글 + 영문), 유일
  sched        text not null default '10:30',        -- 예정 출근 시각 'HH:MM'
  off          smallint[] not null default '{}',     -- 정기 휴무 요일 (0=일 … 6=토)
  emp_type     text not null default '정직원',        -- 정직원 / 수습 / 인턴 / 알바
  pay_type     text,                                 -- 월급 / 일급 / 시급
  wage         numeric(12,2),                        -- 급여액 (฿)
  intern_start date,
  intern_end   date,
  resigned     boolean not null default false,
  resign_date  date,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. 근태 기록 (staff_records)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.staff_records (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff_members(id) on delete cascade,
  date       date not null,
  sched      text default '',        -- 예정 출근
  actual     text default '',        -- 실제 도착
  out_time   text default '',        -- 퇴근 시각
  late       integer,                -- 지각(분), 시각 미입력이면 null
  type       text not null default '정상',  -- 정상/무단/사전통보/승인/병가/무단결근/휴무
  scores     jsonb not null default '{}'::jsonb, -- {"0":5,"1":4,...} 태도 5항목
  avg_score  numeric(4,2),           -- 항목 평균
  memo       text default '',
  legacy_id  text unique,            -- 기존 백업 JSON 의 id (중복 가져오기 방지)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists staff_records_staff_date_idx on public.staff_records(staff_id, date);
create index if not exists staff_records_date_idx       on public.staff_records(date);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. 월 급여 (staff_payroll) — 직원 + 월 복합키
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.staff_payroll (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff_members(id) on delete cascade,
  month      text not null,          -- 'YYYY-MM'
  base       numeric(12,2),          -- 기본급 (null 이면 자동계산값 사용)
  comm       numeric(12,2),          -- 커미션 (null 이면 자동합산값 사용)
  bonus      numeric(12,2),
  deduct     numeric(12,2),
  paid       boolean not null default false,
  paid_date  date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_id, month)
);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. 커미션 (staff_commissions)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.staff_commissions (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff_members(id) on delete cascade,
  date       date not null,
  amount     numeric(12,2) not null default 0,
  memo       text default '',
  legacy_id  text unique,
  created_at timestamptz not null default now()
);
create index if not exists staff_commissions_staff_date_idx on public.staff_commissions(staff_id, date);

-- ───────────────────────────────────────────────────────────────────────────
-- 5. 경고 (staff_warnings)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.staff_warnings (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff_members(id) on delete cascade,
  level      text not null default '서면',   -- '구두' | '서면'
  reason     text default '',
  date       date not null,                 -- 발부일 (서면은 12개월간 유효)
  legacy_id  text unique,
  created_at timestamptz not null default now()
);
create index if not exists staff_warnings_staff_idx on public.staff_warnings(staff_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 6. 월간 평가 의견 (staff_evals) — 직원 + 월 복합키
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.staff_evals (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff_members(id) on delete cascade,
  month      text not null,          -- 'YYYY-MM'
  good       text default '',        -- 잘한 점
  improve    text default '',        -- 개선할 점
  plan       text default '',        -- 다음 달 목표
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_id, month)
);

-- ───────────────────────────────────────────────────────────────────────────
-- 7. updated_at 자동 갱신
-- ───────────────────────────────────────────────────────────────────────────
create or replace function staff_touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare tb text;
begin
  foreach tb in array array['staff_members','staff_records','staff_payroll','staff_evals'] loop
    execute format('drop trigger if exists %I_touch on public.%I', tb, tb);
    execute format(
      'create trigger %I_touch before update on public.%I
         for each row execute function staff_touch_updated_at()', tb, tb);
  end loop;
end $$;

-- ───────────────────────────────────────────────────────────────────────────
-- 8. RLS — 로그인하지 않은 anon 키만으로는 아무것도 못 읽습니다
--    · 직원 계정(staff@…) : 명단 · 근태기록 · 평가의견
--    · 관리자 계정(admin@…): 전부 + 급여 · 커미션 · 경고
-- ───────────────────────────────────────────────────────────────────────────
alter table public.staff_members     enable row level security;
alter table public.staff_records     enable row level security;
alter table public.staff_evals       enable row level security;
alter table public.staff_payroll     enable row level security;
alter table public.staff_commissions enable row level security;
alter table public.staff_warnings    enable row level security;

-- 로그인한 사람이면 누구나 (직원 + 관리자)
drop policy if exists staff_members_rw on public.staff_members;
create policy staff_members_rw on public.staff_members
  for all to authenticated using (true) with check (true);

drop policy if exists staff_records_rw on public.staff_records;
create policy staff_records_rw on public.staff_records
  for all to authenticated using (true) with check (true);

drop policy if exists staff_evals_rw on public.staff_evals;
create policy staff_evals_rw on public.staff_evals
  for all to authenticated using (true) with check (true);

-- 관리자 전용
drop policy if exists staff_payroll_rw on public.staff_payroll;
create policy staff_payroll_rw on public.staff_payroll
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());

drop policy if exists staff_commissions_rw on public.staff_commissions;
create policy staff_commissions_rw on public.staff_commissions
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());

drop policy if exists staff_warnings_rw on public.staff_warnings;
create policy staff_warnings_rw on public.staff_warnings
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.staff_members, public.staff_records, public.staff_evals,
  public.staff_payroll, public.staff_commissions, public.staff_warnings
  to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 9. Realtime — 다른 기기 화면 자동 갱신
-- ───────────────────────────────────────────────────────────────────────────
do $$
declare tb text;
begin
  foreach tb in array array['staff_members','staff_records','staff_payroll',
                            'staff_commissions','staff_warnings','staff_evals'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=tb
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tb);
    end if;
  end loop;
end $$;

-- 삭제 이벤트에 이전 행 정보를 실어 보냅니다 (Realtime DELETE 감지용)
alter table public.staff_members     replica identity full;
alter table public.staff_records     replica identity full;
alter table public.staff_payroll     replica identity full;
alter table public.staff_commissions replica identity full;
alter table public.staff_warnings    replica identity full;
alter table public.staff_evals       replica identity full;

-- ═══════════════════════════════════════════════════════════════════════════
--  끝. 이어서 Authentication → Users 에서 계정 2개를 만드세요.
--    1) staff@hanahayan.co.th  (직원 공용 비밀번호)   ← Auto Confirm User 체크
--    2) admin@hanahayan.co.th  (관리자 비밀번호)      ← Auto Confirm User 체크
--  그리고 Authentication → Providers → Email 에서
--    "Confirm email" 을 끄거나, 위 두 계정을 Auto Confirm 으로 만들어 두세요.
-- ═══════════════════════════════════════════════════════════════════════════
