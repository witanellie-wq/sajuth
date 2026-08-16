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

-- ══ 확인 ══
select column_name as "컬럼", data_type as "타입", column_default as "기본값"
from information_schema.columns
where table_schema='public' and table_name='staff_payees'
order by ordinal_position;
