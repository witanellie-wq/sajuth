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

-- ══ 확인 ══
select 'staff_comm_config' as "표", count(*)::text as "줄" from public.staff_comm_config
union all select 'staff_name_map',      count(*)::text from public.staff_name_map
union all select 'staff_comm_split',    count(*)::text from public.staff_comm_split
union all select 'staff_comm_override', count(*)::text from public.staff_comm_override
union all select '예약장부 bookings',   count(*)::text from public.bookings;
