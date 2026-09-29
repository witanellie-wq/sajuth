-- ═══════════════════════════════════════════════════════════════════════════
--  한 번에 전부 설치  ·  HANAHAYAN 직원 근태 관리
--
--  Supabase Dashboard → SQL Editor → + New query
--  → 이 파일 전체를 복사해 붙여넣고 [Run]  (한 번이면 끝입니다)
--
--  · 이미 만들어져 있는 것은 그냥 건너뜁니다. 여러 번 실행해도 안전합니다.
--  · 기존 데이터는 지우지 않습니다.
--  · 맨 아래에 무엇이 설치됐는지 확인표가 나옵니다.
--
--  patch-01 부터 patch-11 까지를 순서대로 합쳐 둔 파일입니다.
--  개별 파일은 그대로 남아 있으니 따로 돌리셔도 됩니다.
-- ═══════════════════════════════════════════════════════════════════════════


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  접근을 지정한 2개 계정으로 제한                                                ║
-- ║  (patch-01-restrict-access.sql)                                    ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ══ 근태 툴 접근을 지정한 2개 계정으로만 좁힙니다 ══
-- (예약 사이트 계정 · 예약 사이트 가입자는 근태 데이터에 접근 불가)

create or replace function staff_is_member() returns boolean
language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    lower('staff@hanahayan.co.th'),
    lower('admin@hanahayan.co.th')
  );
$$;

drop policy if exists staff_members_rw on public.staff_members;
create policy staff_members_rw on public.staff_members
  for all to authenticated using (staff_is_member()) with check (staff_is_member());

drop policy if exists staff_records_rw on public.staff_records;
create policy staff_records_rw on public.staff_records
  for all to authenticated using (staff_is_member()) with check (staff_is_member());

drop policy if exists staff_evals_rw on public.staff_evals;
create policy staff_evals_rw on public.staff_evals
  for all to authenticated using (staff_is_member()) with check (staff_is_member());


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  지출 관리 (고정비 · 소모품)                                                 ║
-- ║  (patch-02-expenses.sql)                                           ║
-- ╚══════════════════════════════════════════════════════════════════════╝
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


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  사업장 구분 (하나하얀 / 위튼)                                                ║
-- ║  (patch-03-business.sql)                                           ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ═══════════════════════════════════════════════════════════════════════════
--  지출을 사업장별(하나하얀 / 위튼 타일랜드)로 나누기
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
-- ═══════════════════════════════════════════════════════════════════════════

-- 기존에 등록해 둔 항목은 전부 '하나하얀' 으로 들어갑니다.
-- 위튼 쪽 항목은 화면에서 사업장만 바꿔주면 됩니다.
alter table public.staff_fixed_costs
  add column if not exists biz text not null default '하나하얀';

alter table public.staff_expenses
  add column if not exists biz text not null default '하나하얀';

create index if not exists staff_fixed_costs_biz_idx on public.staff_fixed_costs(biz);
create index if not exists staff_expenses_biz_idx     on public.staff_expenses(biz);


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  매출 목표                                                             ║
-- ║  (patch-04-targets.sql)                                            ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ═══════════════════════════════════════════════════════════════════════════
--  목표 매출 기록
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.staff_targets (
  id         uuid primary key default gen_random_uuid(),
  biz        text not null default '하나하얀',   -- 사업장
  month      text not null,                     -- 'YYYY-MM'
  amount     numeric(14,2) not null default 0,  -- 목표 매출 (฿)
  memo       text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (biz, month)
);
create index if not exists staff_targets_month_idx on public.staff_targets(month);

drop trigger if exists staff_targets_touch on public.staff_targets;
create trigger staff_targets_touch before update on public.staff_targets
  for each row execute function staff_touch_updated_at();

-- 매출 목표도 돈 정보이므로 관리자만
alter table public.staff_targets enable row level security;

drop policy if exists staff_targets_rw on public.staff_targets;
create policy staff_targets_rw on public.staff_targets
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());

grant select, insert, update, delete on public.staff_targets to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='staff_targets'
  ) then
    alter publication supabase_realtime add table public.staff_targets;
  end if;
end $$;

alter table public.staff_targets replica identity full;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  직원 급여 계좌                                                          ║
-- ║  (patch-05-bank.sql)                                               ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ═══════════════════════════════════════════════════════════════════════════
--  직원 급여 계좌 (은행 · 계좌번호 · 예금주)
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.staff_members
  add column if not exists bank_name    text default '',   -- 은행 (SCB / Kasikorn …)
  add column if not exists bank_account text default '',   -- 계좌번호
  add column if not exists bank_holder  text default '';   -- 예금주 (직원 이름과 다를 때만)


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  급여 변경(인상) 이력                                                      ║
-- ║  (patch-06-wage-history.sql)                                       ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ═══════════════════════════════════════════════════════════════════════════
--  급여 변경(인상) 이력
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
--
--  왜 필요한가:
--    지금까지는 직원마다 급여액이 하나뿐이라, 8월에 급여를 올리면
--    7월 급여표까지 새 금액으로 다시 계산돼 과거 기록이 틀어졌습니다.
--    '적용 시작 월' 을 가진 이력으로 바꿔서, 각 달은 그 달에 유효했던
--    금액으로 계산되게 합니다.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.staff_wage_history (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff_members(id) on delete cascade,
  from_month text not null,                 -- 'YYYY-MM' — 이 달부터 적용
  pay_type   text not null default '일급',   -- 월급 / 일급 / 시급
  wage       numeric(12,2) not null default 0,
  memo       text default '',               -- 인상 사유
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_id, from_month)
);
create index if not exists staff_wage_history_staff_idx
  on public.staff_wage_history(staff_id, from_month);

drop trigger if exists staff_wage_history_touch on public.staff_wage_history;
create trigger staff_wage_history_touch before update on public.staff_wage_history
  for each row execute function staff_touch_updated_at();

-- ── RLS · Realtime (급여 정보이므로 관리자 전용) ──
alter table public.staff_wage_history enable row level security;

drop policy if exists staff_wage_history_rw on public.staff_wage_history;
create policy staff_wage_history_rw on public.staff_wage_history
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());

grant select, insert, update, delete on public.staff_wage_history to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='staff_wage_history'
  ) then
    alter publication supabase_realtime add table public.staff_wage_history;
  end if;
end $$;

alter table public.staff_wage_history replica identity full;

-- ───────────────────────────────────────────────────────────────────────────
--  기존에 입력해 둔 급여액을 '최초 급여' 로 옮깁니다.
--  from_month '2000-01' = 아주 예전부터 적용 → 과거 달도 이 금액으로 계산됩니다.
--  이미 이력이 있는 직원은 건드리지 않습니다.
-- ───────────────────────────────────────────────────────────────────────────
insert into public.staff_wage_history (staff_id, from_month, pay_type, wage, memo)
select m.id, '2000-01',
       coalesce(nullif(m.pay_type,''), case when m.emp_type='알바' then '시급' else '일급' end),
       m.wage, '최초 급여'
from public.staff_members m
where m.wage is not null and m.wage > 0
  and not exists (select 1 from public.staff_wage_history h where h.staff_id = m.id);


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  사비 결제 · 정산                                                        ║
-- ║  (patch-07-reimburse.sql)                                          ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ═══════════════════════════════════════════════════════════════════════════
--  사비 결제 · 정산 (임원이 회사 비용을 개인 돈으로 낸 건)
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
--
--  생각하는 방식:
--    · 누가 냈든 그건 '회사 지출' 이므로 총지출에는 그대로 들어갑니다.
--    · 사비로 낸 건은 별도로 '회사가 그 사람에게 갚아야 할 돈' 이 됩니다.
--      → paid_by 가 '회사' 가 아니고 reimbursed_at 이 비어 있으면 미정산.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.staff_expenses
  add column if not exists paid_by       text not null default '회사',  -- 결제자
  add column if not exists reimbursed_at date;                          -- 정산(변제)일, 비어있으면 미정산

create index if not exists staff_expenses_payer_idx
  on public.staff_expenses(paid_by, reimbursed_at);

-- 고정비도 사비로 낼 수 있으므로 같이 붙여 둡니다
alter table public.staff_fixed_payments
  add column if not exists paid_by       text not null default '회사',
  add column if not exists reimbursed_at date;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  기타 이체 계좌 (직원 외)                                                   ║
-- ║  (patch-08-payees.sql)                                             ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ═══════════════════════════════════════════════════════════════════════════
--  기타 이체 계좌 (직원 외 — 건물주 · 거래처 · 공과금 · 세무사 …)
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
--
--  직원 급여 계좌는 staff_members 안에 들어 있습니다.
--  직원이 아닌 곳으로 보내는 계좌는 그와 별개이므로 따로 둡니다.
--  급여·계좌 정보이므로 관리자만 읽고 쓸 수 있습니다.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.staff_payees (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,                    -- 받는 곳 (예: 건물주 김OO / True 인터넷)
  category     text not null default '기타',     -- 임대료 / 거래처 / 공과금 …  자유 입력
  biz          text not null default '하나하얀', -- 사업장
  bank_name    text default '',                  -- 은행 (SCB / Kasikorn …)
  bank_account text default '',                  -- 계좌번호
  bank_holder  text default '',                  -- 예금주
  memo         text default '',
  active       boolean not null default true,
  sort_order   integer not null default 0,
  legacy_id    text unique,                      -- 백업 가져오기가 중복되지 않도록
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists staff_payees_biz_idx on public.staff_payees(biz, sort_order);

drop trigger if exists staff_payees_touch on public.staff_payees;
create trigger staff_payees_touch before update on public.staff_payees
  for each row execute function staff_touch_updated_at();

-- ── RLS · Realtime (계좌 정보이므로 관리자 전용) ──
alter table public.staff_payees enable row level security;

drop policy if exists staff_payees_rw on public.staff_payees;
create policy staff_payees_rw on public.staff_payees
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());

grant select, insert, update, delete on public.staff_payees to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='staff_payees'
  ) then
    alter publication supabase_realtime add table public.staff_payees;
  end if;
end $$;

alter table public.staff_payees replica identity full;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  자동 커미션 — 예약장부 연동                                                  ║
-- ║  (patch-09-commission.sql)                                         ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ═══════════════════════════════════════════════════════════════════════════
--  자동 커미션 — 부킹테이블(예약장부) 연동
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
--
--  어떻게 도는가:
--    · 예약장부(public.bookings)에 이미 '담당자 · 결제금액 · 방문여부' 가 들어 있습니다.
--      그걸 그대로 읽어서 커미션을 계산합니다 — 매출을 다시 입력하지 않습니다.
--    · 여기서 만드는 표 3개는 '계산 규칙' 만 담습니다.
--
--    staff_comm_config  커미션 비율(기본 3%) · 고와비 기준
--    staff_name_map     예약장부의 담당자 이름  ↔  직원 관리의 직원
--                       (예: 예약장부 'Bew'  →  직원 '뷰 Bew')
--    staff_comm_split   한 건을 여러 명이 했을 때 나누는 비율
--                       (비워두면 인원수대로 똑같이 나눕니다)
--    staff_comm_override 예약장부 금액과 실제 받은 돈이 다를 때 덮어쓰는 금액
--                       (예약장부는 건드리지 않고 여기에만 남습니다)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1) 커미션 규칙 (한 줄짜리 설정) ──
create table if not exists public.staff_comm_config (
  id            integer primary key default 1 check (id = 1),
  rate          numeric(6,3) not null default 3,        -- 커미션 % (3 = 3%)
  gowabi_basis  text         not null default 'net',    -- net = 수수료 뗀 실수령 / gross = 전액 / none = 제외
  min_amount    numeric(12,2) not null default 0,       -- 이 금액 미만 건은 커미션 없음 (0 = 제한 없음)
  updated_at    timestamptz  not null default now()
);
insert into public.staff_comm_config (id) values (1) on conflict (id) do nothing;

-- ── 2) 이름 잇기 — 예약장부 담당자 ↔ 직원 관리 직원 ──
create table if not exists public.staff_name_map (
  booking_name text primary key,                        -- 예약장부에 적힌 이름 그대로
  staff_id     uuid references public.staff_members(id) on delete cascade,
  updated_at   timestamptz not null default now()
);
create index if not exists staff_name_map_staff_idx on public.staff_name_map(staff_id);

-- ── 3) 한 건을 나눠 가질 때의 비율 ──
create table if not exists public.staff_comm_split (
  booking_id   bigint not null,                         -- public.bookings.id
  booking_name text   not null,                         -- 예약장부에 적힌 담당자 이름
  share        numeric(7,4) not null default 0,         -- 가중치. 같은 건의 합으로 나눠 씁니다
  updated_at   timestamptz not null default now(),
  primary key (booking_id, booking_name)
);
create index if not exists staff_comm_split_bk_idx on public.staff_comm_split(booking_id);

-- ── 4) 실제 결제액 덮어쓰기 ──
--    예약장부에 적힌 금액과 실제로 받은 돈이 다를 때만 한 줄이 생깁니다.
--    비어 있으면 예약장부 금액을 그대로 씁니다. 예약장부 원본은 바뀌지 않습니다.
create table if not exists public.staff_comm_override (
  booking_id bigint primary key,                        -- public.bookings.id
  amount     numeric(12,2),                             -- 실제 받은 금액 (null = 예약장부 금액 사용)
  memo       text default '',                           -- 왜 다른지
  updated_at timestamptz not null default now()
);

-- ── updated_at 자동 갱신 ──
drop trigger if exists staff_comm_config_touch on public.staff_comm_config;
create trigger staff_comm_config_touch before update on public.staff_comm_config
  for each row execute function staff_touch_updated_at();
drop trigger if exists staff_name_map_touch on public.staff_name_map;
create trigger staff_name_map_touch before update on public.staff_name_map
  for each row execute function staff_touch_updated_at();
drop trigger if exists staff_comm_split_touch on public.staff_comm_split;
create trigger staff_comm_split_touch before update on public.staff_comm_split
  for each row execute function staff_touch_updated_at();
drop trigger if exists staff_comm_override_touch on public.staff_comm_override;
create trigger staff_comm_override_touch before update on public.staff_comm_override
  for each row execute function staff_touch_updated_at();

-- ── RLS · Realtime (급여에 직결되므로 관리자 전용) ──
alter table public.staff_comm_config   enable row level security;
alter table public.staff_name_map      enable row level security;
alter table public.staff_comm_split    enable row level security;
alter table public.staff_comm_override enable row level security;

drop policy if exists staff_comm_config_rw on public.staff_comm_config;
create policy staff_comm_config_rw on public.staff_comm_config
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());
drop policy if exists staff_name_map_rw on public.staff_name_map;
create policy staff_name_map_rw on public.staff_name_map
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());
drop policy if exists staff_comm_split_rw on public.staff_comm_split;
create policy staff_comm_split_rw on public.staff_comm_split
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());
drop policy if exists staff_comm_override_rw on public.staff_comm_override;
create policy staff_comm_override_rw on public.staff_comm_override
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());

grant select, insert, update, delete on public.staff_comm_config   to authenticated;
grant select, insert, update, delete on public.staff_name_map      to authenticated;
grant select, insert, update, delete on public.staff_comm_split    to authenticated;
grant select, insert, update, delete on public.staff_comm_override to authenticated;

do $$
declare tb text;
begin
  foreach tb in array array['staff_comm_config','staff_name_map','staff_comm_split','staff_comm_override'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=tb
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tb);
    end if;
    execute format('alter table public.%I replica identity full', tb);
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
--  ※ 예약장부(bookings · staff · settings)는 손대지 않습니다.
--     그 표들은 이미 '로그인한 사용자 모두 읽기' 로 열려 있어서
--     관리자 계정으로 그대로 읽힙니다. 예약장부 쪽 변경은 필요 없습니다.
-- ═══════════════════════════════════════════════════════════════════════════


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  커미션 판매금액 · 비율                                                     ║
-- ║  (patch-10-commission-lines.sql)                                   ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ═══════════════════════════════════════════════════════════════════════════
--  커미션 — 판매금액에서 자동 계산 + 사진 붙여넣기 가져오기
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
--
--  왜 필요한가:
--    지금까지 커미션은 '지급할 금액' 하나만 저장했습니다.
--    이제 '판매금액' 과 '비율' 도 같이 남겨서
--      · 3% 가 제대로 계산됐는지 나중에 확인할 수 있고
--      · 비율이 바뀌어도 판매금액에서 다시 계산할 수 있습니다.
--    (판매금액을 안 넣고 커미션액만 넣는 기존 방식도 그대로 됩니다)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.staff_commissions
  add column if not exists sale_amount numeric(12,2),   -- 판매금액 (비우면 커미션액만 직접 넣은 것)
  add column if not exists rate        numeric(6,3),    -- 그 건에 적용한 % (비우면 기본 비율)
  add column if not exists share       numeric(7,4),    -- 여러 명이 나눴을 때의 몫 (1 = 혼자)
  add column if not exists src         text default ''; -- 'paste' = 사진 붙여넣기로 들어온 건

create index if not exists staff_commissions_date_idx
  on public.staff_commissions(date);


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  커미션 시작일 · 날짜별 제외                                                  ║
-- ║  (patch-11-commission-start.sql)                                   ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- ═══════════════════════════════════════════════════════════════════════════
--  커미션 시작일 · 날짜별 제외
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--  여러 번 실행해도 안전합니다.
--
--  왜 필요한가:
--    커미션을 중간부터 주기 시작한 달이 있습니다 (예: 9월은 19일부터).
--    그 전 날짜까지 3% 가 붙으면 안 되므로 '시작일' 을 둡니다.
--    시작일 뒤라도 특정 날만 빼야 할 때가 있어 '제외한 날' 도 따로 둡니다.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.staff_comm_config
  add column if not exists start_date date;     -- 이 날짜부터 커미션 계산 (비우면 전부)

-- 시작일 뒤인데도 커미션을 안 주는 날
create table if not exists public.staff_comm_skip (
  day        date primary key,
  memo       text default '',
  updated_at timestamptz not null default now()
);

drop trigger if exists staff_comm_skip_touch on public.staff_comm_skip;
create trigger staff_comm_skip_touch before update on public.staff_comm_skip
  for each row execute function staff_touch_updated_at();

alter table public.staff_comm_skip enable row level security;

drop policy if exists staff_comm_skip_rw on public.staff_comm_skip;
create policy staff_comm_skip_rw on public.staff_comm_skip
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());

grant select, insert, update, delete on public.staff_comm_skip to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='staff_comm_skip'
  ) then
    alter publication supabase_realtime add table public.staff_comm_skip;
  end if;
end $$;

alter table public.staff_comm_skip replica identity full;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  확인 — 아래 목록이 전부 '있음' 이면 설치가 끝난 것입니다            ║
-- ╚══════════════════════════════════════════════════════════════════════╝
select '표' as "종류", t.name as "이름",
       case when to_regclass('public.'||t.name) is null then '✗ 없음' else '✓ 있음' end as "상태"
from (values
  ('staff_members'),('staff_records'),('staff_payroll'),('staff_commissions'),
  ('staff_warnings'),('staff_evals'),
  ('staff_fixed_costs'),('staff_fixed_payments'),('staff_expenses'),('staff_targets'),
  ('staff_wage_history'),('staff_payees'),
  ('staff_comm_config'),('staff_name_map'),('staff_comm_split'),
  ('staff_comm_override'),('staff_comm_skip')
) as t(name)
union all
select '칸', c.tb||' . '||c.col,
       case when exists (select 1 from information_schema.columns
                         where table_schema='public' and table_name=c.tb and column_name=c.col)
            then '✓ 있음' else '✗ 없음' end
from (values
  ('staff_members','bank_account'),
  ('staff_fixed_costs','biz'),
  ('staff_expenses','paid_by'),
  ('staff_expenses','reimbursed_at'),
  ('staff_commissions','sale_amount'),
  ('staff_commissions','share'),
  ('staff_comm_config','start_date')
) as c(tb,col)
order by 1 desc, 2;
