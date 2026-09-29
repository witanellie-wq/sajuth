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
select '1/6 완료 · 급여 인상 이력' as "결과";
