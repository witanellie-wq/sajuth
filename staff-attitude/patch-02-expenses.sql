-- ═══════════════════════════════════════════════════════════════════════════
--  지출 관리 추가 — 고정비 · 소모품/일시 지출
--  Supabase Dashboard → SQL Editor → New query → 전체 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. 고정비 항목 (한 번 등록해두면 매달 자동으로 표에 뜹니다)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.staff_fixed_costs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                    -- 임대료 / 전기요금 …
  category    text not null default '기타',      -- 임대료/공과금/통신/보험/구독·서비스/세금/기타
  amount      numeric(12,2) not null default 0, -- 기본 금액 (฿)
  due_day     smallint,                         -- 매월 납부일 (1~31, 없으면 null)
  active      boolean not null default true,    -- 사용 중지하면 false
  start_month text,                             -- 'YYYY-MM' 부터 (null = 제한 없음)
  end_month   text,                             -- 'YYYY-MM' 까지 (null = 계속)
  memo        text default '',
  sort_order  integer not null default 0,
  legacy_id   text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. 고정비 월별 납부 (항목 + 월 복합키)
--    amount 가 null 이면 위 기본 금액을 씁니다 (전기요금처럼 달마다 다르면 여기서 덮어씀)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.staff_fixed_payments (
  id         uuid primary key default gen_random_uuid(),
  cost_id    uuid not null references public.staff_fixed_costs(id) on delete cascade,
  month      text not null,                     -- 'YYYY-MM'
  amount     numeric(12,2),
  paid       boolean not null default false,
  paid_date  date,
  memo       text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cost_id, month)
);
create index if not exists staff_fixed_payments_month_idx on public.staff_fixed_payments(month);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. 소모품 · 일시 지출
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.staff_expenses (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  category   text not null default '소모품',     -- 소모품/제품·재고/장비·수리/마케팅/세금·수수료/기타
  item       text not null default '',          -- 내용
  amount     numeric(12,2) not null default 0,
  memo       text default '',
  legacy_id  text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists staff_expenses_date_idx on public.staff_expenses(date);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. updated_at 자동 갱신
-- ───────────────────────────────────────────────────────────────────────────
do $$
declare tb text;
begin
  foreach tb in array array['staff_fixed_costs','staff_fixed_payments','staff_expenses'] loop
    execute format('drop trigger if exists %I_touch on public.%I', tb, tb);
    execute format(
      'create trigger %I_touch before update on public.%I
         for each row execute function staff_touch_updated_at()', tb, tb);
  end loop;
end $$;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. RLS — 지출은 돈 정보이므로 관리자 계정만
-- ───────────────────────────────────────────────────────────────────────────
alter table public.staff_fixed_costs    enable row level security;
alter table public.staff_fixed_payments enable row level security;
alter table public.staff_expenses       enable row level security;

drop policy if exists staff_fixed_costs_rw on public.staff_fixed_costs;
create policy staff_fixed_costs_rw on public.staff_fixed_costs
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());

drop policy if exists staff_fixed_payments_rw on public.staff_fixed_payments;
create policy staff_fixed_payments_rw on public.staff_fixed_payments
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());

drop policy if exists staff_expenses_rw on public.staff_expenses;
create policy staff_expenses_rw on public.staff_expenses
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());

grant select, insert, update, delete on
  public.staff_fixed_costs, public.staff_fixed_payments, public.staff_expenses
  to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 6. Realtime
-- ───────────────────────────────────────────────────────────────────────────
do $$
declare tb text;
begin
  foreach tb in array array['staff_fixed_costs','staff_fixed_payments','staff_expenses'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=tb
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tb);
    end if;
  end loop;
end $$;

alter table public.staff_fixed_costs    replica identity full;
alter table public.staff_fixed_payments replica identity full;
alter table public.staff_expenses       replica identity full;

-- ═══════════════════════════════════════════════════════════════════════════
--  확인
-- ═══════════════════════════════════════════════════════════════════════════
select c.relname as "테이블",
       c.relrowsecurity as "RLS",
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname) as "정책",
       exists(select 1 from pg_publication_tables t
         where t.pubname='supabase_realtime' and t.tablename=c.relname) as "실시간"
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in ('staff_fixed_costs','staff_fixed_payments','staff_expenses')
order by 1;
