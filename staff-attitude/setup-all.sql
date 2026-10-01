-- ▼▼▼▼▼ 여기부터 복사 ▼▼▼▼▼   HANAHAYAN 직원 근태 관리 — 전체 설치
-- Supabase → SQL Editor → + New query → 전부 붙여넣고 Run
-- 이미 있는 것은 건너뜁니다. 데이터는 지우지 않습니다. 여러 번 실행해도 안전합니다.

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
create table if not exists public.staff_fixed_costs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null default '기타',
  amount      numeric(12,2) not null default 0,
  due_day     smallint,
  active      boolean not null default true,
  start_month text,
  end_month   text,
  memo        text default '',
  sort_order  integer not null default 0,
  legacy_id   text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create table if not exists public.staff_fixed_payments (
  id         uuid primary key default gen_random_uuid(),
  cost_id    uuid not null references public.staff_fixed_costs(id) on delete cascade,
  month      text not null,
  amount     numeric(12,2),
  paid       boolean not null default false,
  paid_date  date,
  memo       text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cost_id, month)
);
create index if not exists staff_fixed_payments_month_idx on public.staff_fixed_payments(month);
create table if not exists public.staff_expenses (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  category   text not null default '소모품',
  item       text not null default '',
  amount     numeric(12,2) not null default 0,
  memo       text default '',
  legacy_id  text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists staff_expenses_date_idx on public.staff_expenses(date);
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
alter table public.staff_fixed_costs
  add column if not exists biz text not null default '하나하얀';
alter table public.staff_expenses
  add column if not exists biz text not null default '하나하얀';
create index if not exists staff_fixed_costs_biz_idx on public.staff_fixed_costs(biz);
create index if not exists staff_expenses_biz_idx     on public.staff_expenses(biz);
create table if not exists public.staff_targets (
  id         uuid primary key default gen_random_uuid(),
  biz        text not null default '하나하얀',
  month      text not null,
  amount     numeric(14,2) not null default 0,
  memo       text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (biz, month)
);
create index if not exists staff_targets_month_idx on public.staff_targets(month);
drop trigger if exists staff_targets_touch on public.staff_targets;
create trigger staff_targets_touch before update on public.staff_targets
  for each row execute function staff_touch_updated_at();
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
alter table public.staff_members
  add column if not exists bank_name    text default '',
  add column if not exists bank_account text default '',
  add column if not exists bank_holder  text default '';
create table if not exists public.staff_wage_history (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff_members(id) on delete cascade,
  from_month text not null,
  pay_type   text not null default '일급',
  wage       numeric(12,2) not null default 0,
  memo       text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_id, from_month)
);
create index if not exists staff_wage_history_staff_idx
  on public.staff_wage_history(staff_id, from_month);
drop trigger if exists staff_wage_history_touch on public.staff_wage_history;
create trigger staff_wage_history_touch before update on public.staff_wage_history
  for each row execute function staff_touch_updated_at();
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
insert into public.staff_wage_history (staff_id, from_month, pay_type, wage, memo)
select m.id, '2000-01',
       coalesce(nullif(m.pay_type,''), case when m.emp_type='알바' then '시급' else '일급' end),
       m.wage, '최초 급여'
from public.staff_members m
where m.wage is not null and m.wage > 0
  and not exists (select 1 from public.staff_wage_history h where h.staff_id = m.id);
alter table public.staff_expenses
  add column if not exists paid_by       text not null default '회사',
  add column if not exists reimbursed_at date;
create index if not exists staff_expenses_payer_idx
  on public.staff_expenses(paid_by, reimbursed_at);
alter table public.staff_fixed_payments
  add column if not exists paid_by       text not null default '회사',
  add column if not exists reimbursed_at date;
create table if not exists public.staff_payees (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null default '기타',
  biz          text not null default '하나하얀',
  bank_name    text default '',
  bank_account text default '',
  bank_holder  text default '',
  memo         text default '',
  active       boolean not null default true,
  sort_order   integer not null default 0,
  legacy_id    text unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists staff_payees_biz_idx on public.staff_payees(biz, sort_order);
drop trigger if exists staff_payees_touch on public.staff_payees;
create trigger staff_payees_touch before update on public.staff_payees
  for each row execute function staff_touch_updated_at();
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
create table if not exists public.staff_comm_config (
  id            integer primary key default 1 check (id = 1),
  rate          numeric(6,3) not null default 3,
  gowabi_basis  text         not null default 'net',
  min_amount    numeric(12,2) not null default 0,
  updated_at    timestamptz  not null default now()
);
insert into public.staff_comm_config (id) values (1) on conflict (id) do nothing;
create table if not exists public.staff_name_map (
  booking_name text primary key,
  staff_id     uuid references public.staff_members(id) on delete cascade,
  updated_at   timestamptz not null default now()
);
create index if not exists staff_name_map_staff_idx on public.staff_name_map(staff_id);
create table if not exists public.staff_comm_split (
  booking_id   bigint not null,
  booking_name text   not null,
  share        numeric(7,4) not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (booking_id, booking_name)
);
create index if not exists staff_comm_split_bk_idx on public.staff_comm_split(booking_id);
create table if not exists public.staff_comm_override (
  booking_id bigint primary key,
  amount     numeric(12,2),
  memo       text default '',
  updated_at timestamptz not null default now()
);
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
alter table public.staff_commissions
  add column if not exists sale_amount numeric(12,2),
  add column if not exists rate        numeric(6,3),
  add column if not exists share       numeric(7,4),
  add column if not exists src         text default '';
create index if not exists staff_commissions_date_idx
  on public.staff_commissions(date);
alter table public.staff_comm_config
  add column if not exists start_date date;
create table if not exists public.staff_comm_skip (
  day        date primary key,
  memo       text default '',
  updated_at timestamptz not null default now()
);
alter table public.staff_comm_skip
  add column if not exists skip     boolean not null default true,
  add column if not exists discount numeric(12,2) not null default 0;
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

-- ── VAT 제외 기준 (patch-12) ──
alter table public.staff_comm_config
  add column if not exists vat_rate numeric(6,3) not null default 0;

-- ── 건별 커미션 제외 · 금액 확인 (patch-13 · patch-16) ──
alter table public.staff_comm_override
  add column if not exists skip       boolean not null default false,
  add column if not exists skip_why   text default '',
  add column if not exists checked    boolean not null default false,
  add column if not exists checked_at timestamptz;

-- ── 급여 추가 지급 · 공제 내역 (patch-14) ──
create table if not exists public.staff_pay_items (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff_members(id) on delete cascade,
  month      text not null,
  kind       text not null default '공제',
  reason     text default '',
  amount     numeric(12,2) not null default 0,
  days       numeric(5,2),
  date       date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists staff_pay_items_idx
  on public.staff_pay_items(staff_id, month);
drop trigger if exists staff_pay_items_touch on public.staff_pay_items;
create trigger staff_pay_items_touch before update on public.staff_pay_items
  for each row execute function staff_touch_updated_at();
alter table public.staff_pay_items enable row level security;
drop policy if exists staff_pay_items_rw on public.staff_pay_items;
create policy staff_pay_items_rw on public.staff_pay_items
  for all to authenticated using (staff_is_admin()) with check (staff_is_admin());
grant select, insert, update, delete on public.staff_pay_items to authenticated;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='staff_pay_items'
  ) then
    alter publication supabase_realtime add table public.staff_pay_items;
  end if;
end $$;
alter table public.staff_pay_items replica identity full;

select '표' as "종류", t.name as "이름",
       case when to_regclass('public.'||t.name) is null then '✗ 없음' else '✓ 있음' end as "상태"
from (values
  ('staff_members'),('staff_records'),('staff_payroll'),('staff_commissions'),
  ('staff_warnings'),('staff_evals'),
  ('staff_fixed_costs'),('staff_fixed_payments'),('staff_expenses'),('staff_targets'),
  ('staff_wage_history'),('staff_payees'),
  ('staff_comm_config'),('staff_name_map'),('staff_comm_split'),
  ('staff_comm_override'),('staff_comm_skip'),('staff_pay_items')
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
  ('staff_comm_config','start_date'),
  ('staff_comm_config','vat_rate'),
  ('staff_comm_override','skip'),
  ('staff_comm_override','checked'),
  ('staff_comm_skip','discount')
) as c(tb,col)
order by 1 desc, 2;

-- ▲▲▲▲▲ 여기까지 ▲▲▲▲▲
-- 붙여넣은 맨 아래에 이 줄이 안 보이면 복사가 잘린 것입니다. 다시 복사하세요.
