-- ═══════════════════════════════════════════════════════════════════════════
--  이름 · 직함 한꺼번에 바꾸기   '이인규 이사'  →  '이인규 회장'
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--
--  · '이인규 이사님' 처럼 뒤에 '님' 이 붙어 있어도 '이인규 회장님' 으로 바뀝니다.
--  · staff_ 로 시작하는 모든 표의 모든 글자 칸을 훑습니다
--    (결제자 · 받는 곳 · 예금주 · 비고 · 항목명 · 사유 …)
--  · 그 글자가 없는 칸은 건드리지 않습니다. 여러 번 실행해도 안전합니다.
--  · 다른 이름을 바꿀 때는 아래 OLD / NEW 두 줄만 고치면 됩니다.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  OLD_TXT constant text := '이인규 이사';   -- ← 바꾸기 전
  NEW_TXT constant text := '이인규 회장';   -- ← 바꾼 뒤
  r     record;
  n     bigint;
  total bigint := 0;
begin
  for r in
    select c.table_name, c.column_name
    from information_schema.columns c
    join information_schema.tables tb
      on tb.table_schema = c.table_schema
     and tb.table_name   = c.table_name
     and tb.table_type   = 'BASE TABLE'
    where c.table_schema = 'public'
      and c.table_name like 'staff\_%'
      and c.data_type in ('text','character varying')
      and c.is_updatable = 'YES'
    order by c.table_name, c.column_name
  loop
    execute format(
      'update public.%I set %I = replace(%I, $1, $2) where %I like $3',
      r.table_name, r.column_name, r.column_name, r.column_name)
      using OLD_TXT, NEW_TXT, '%' || OLD_TXT || '%';
    get diagnostics n = row_count;
    if n > 0 then
      raise notice '  ✓ %.%  →  % 건', r.table_name, r.column_name, n;
      total := total + n;
    end if;
  end loop;
  if total = 0 then
    raise notice '바꿀 내용이 없습니다 — "%" 라고 적힌 칸을 찾지 못했습니다.', OLD_TXT;
  else
    raise notice '───── 모두 % 군데를 "%" 로 바꿨습니다.', total, NEW_TXT;
  end if;
end $$;
