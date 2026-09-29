-- ▼▼▼ 7/7 · 설치 확인 — 여기부터 전부 복사 ▼▼▼

select '표' as "종류", t.name as "이름",
       case when to_regclass('public.'||t.name) is null then '✗ 없음' else '✓ 있음' end as "상태"
from (values
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
  ('staff_expenses','paid_by'),
  ('staff_expenses','reimbursed_at'),
  ('staff_commissions','sale_amount'),
  ('staff_commissions','share'),
  ('staff_comm_config','start_date')
) as c(tb,col)
order by 1 desc, 2;

-- ▲▲▲ 7/7 끝 · 이 줄까지 보여야 합니다 ▲▲▲
