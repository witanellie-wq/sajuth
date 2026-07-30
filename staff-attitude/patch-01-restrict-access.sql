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

-- ══ 확인 ══
select c.relname as "테이블",
       c.relrowsecurity as "RLS",
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname) as "정책",
       exists(select 1 from pg_publication_tables t
         where t.pubname='supabase_realtime' and t.tablename=c.relname) as "실시간"
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname like 'staff\_%'
order by 1;

select email,
       email_confirmed_at is not null as "이메일확인됨"
from auth.users
where email in ('staff@hanahayan.co.th','admin@hanahayan.co.th')
order by email;
