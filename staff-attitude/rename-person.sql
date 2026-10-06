-- ═══════════════════════════════════════════════════════════════════════════
--  이름 · 직함 한꺼번에 바꾸기   '이인규 이사'  →  '이인규 회장'
--  Supabase Dashboard → SQL Editor → + New query → 붙여넣기 → Run
--
--  · '이인규 이사님' 처럼 뒤에 '님' 이 붙어 있어도 '이인규 회장님' 으로 바뀝니다.
--  · 띄어쓰기 없이 '이인규이사' 라고 적힌 것도 '이인규회장' 으로 바뀝니다.
--  · staff_ 로 시작하는 모든 표의 모든 글자 칸을 훑습니다
--    (결제자 · 받는 곳 · 예금주 · 비고 · 항목명 · 사유 …)
--  · 그 글자가 없는 칸은 건드리지 않습니다. 여러 번 실행해도 안전합니다.
--  · 맨 아래에 '이인규' 가 아직 남아 있는 곳을 모두 보여 줍니다 — 비어 있으면 끝난 것입니다.
--  · 다른 이름을 바꿀 때는 아래 OLD / NEW 두 줄만 고치면 됩니다.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  WHO     constant text := '이인규';     -- ← 사람 이름 (확인용으로도 씁니다)
  OLD_TTL constant text := '이사';       -- ← 바꾸기 전 직함
  NEW_TTL constant text := '회장';       -- ← 바꾼 뒤 직함
  pairs text[][] := array[
    array[WHO || ' ' || OLD_TTL, WHO || ' ' || NEW_TTL],   -- '이인규 이사'  → '이인규 회장'
    array[WHO || OLD_TTL,        WHO || NEW_TTL]           -- '이인규이사'   → '이인규회장'
  ];
  r     record;
  i     int;
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
    for i in 1 .. array_length(pairs, 1) loop
      execute format(
        'update public.%I set %I = replace(%I, $1, $2) where %I like $3',
        r.table_name, r.column_name, r.column_name, r.column_name)
        using pairs[i][1], pairs[i][2], '%' || pairs[i][1] || '%';
      get diagnostics n = row_count;
      if n > 0 then
        raise notice '  ✓ %.%  ·  "%" → "%"  ·  % 건',
          r.table_name, r.column_name, pairs[i][1], pairs[i][2], n;
        total := total + n;
      end if;
    end loop;
  end loop;

  if total = 0 then
    raise notice '바꿀 내용이 없습니다 — "% %" 라고 적힌 칸을 찾지 못했습니다. (이미 바꿨을 수 있습니다)',
      WHO, OLD_TTL;
  else
    raise notice '───── 모두 % 군데를 "% %" 로 바꿨습니다.', total, WHO, NEW_TTL;
  end if;
end $$;

-- ══ 확인 — '이인규' 가 아직 남아 있는 곳을 모두 보여 줍니다 ══
--    '이인규 회장' 만 나오면 끝난 것입니다.
--    '이인규 이사' 가 남아 있으면 그 표 · 칸을 알려 주세요.
do $$
declare
  WHO constant text := '이인규';
  r   record;
  v   text;
  cnt bigint := 0;
begin
  -- on commit drop 을 쓰면 이 블록이 끝나면서 표가 사라져 아래 select 가 못 읽습니다
  drop table if exists _rename_check;
  create temp table _rename_check(
    "표" text, "칸" text, "지금 값" text, "건수" bigint);
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
    order by c.table_name, c.column_name
  loop
    execute format(
      'insert into _rename_check
         select %L, %L, %I, count(*) from public.%I where %I like $1 group by %I',
      r.table_name, r.column_name, r.column_name, r.table_name, r.column_name, r.column_name)
      using '%' || WHO || '%';
  end loop;
  select count(*) into cnt from _rename_check;
  if cnt = 0 then
    raise notice '확인 — "%" 라고 적힌 칸이 한 군데도 없습니다.', WHO;
  end if;
end $$;

select "표", "칸", "지금 값", "건수" from _rename_check order by 1, 2, 3;
drop table if exists _rename_check;
