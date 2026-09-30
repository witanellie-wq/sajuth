-- ═══════════════════════════════════════════════════════════════════════════
--  급여 추가 지급 · 공제 내역
--  Supabase → SQL Editor → + New query → 붙여넣고 Run
--  여러 번 실행해도 안전합니다.
--
--  왜 필요한가:
--    급여표에 보너스 · 공제 금액칸은 있지만 '왜' 가 남지 않습니다.
--    무급휴가 며칠을 뺐는지, 무슨 명목으로 더 줬는지 나중에 알 수 없습니다.
--    커미션처럼 건별로 적어 두면 급여표에 자동으로 합산됩니다.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.staff_pay_items (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff_members(id) on delete cascade,
  month      text not null,                      -- 'YYYY-MM' 이 달 급여에 반영
  kind       text not null default '공제',       -- '추가' | '공제'
  reason     text default '',                    -- 무급휴가 / 가불 / 명절 보너스 …
  amount     numeric(12,2) not null default 0,
  days       numeric(5,2),                       -- 무급휴가 일수 (있으면)
  date       date,                               -- 언제 있었던 일인지 (있으면)
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

select '완료 — 추가 지급 · 공제 내역' as "결과";
