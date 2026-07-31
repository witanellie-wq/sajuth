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

-- ══ 확인 ══
select m.name as "직원", h.from_month as "적용 시작", h.pay_type as "급여 방식",
       h.wage as "금액", h.memo as "사유"
from public.staff_wage_history h
join public.staff_members m on m.id = h.staff_id
order by m.name, h.from_month;
