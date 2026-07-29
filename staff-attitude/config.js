/* ═══════════════════════════════════════════════════════════════════
   HANAHAYAN 직원 관리 · 접속 설정
   ─────────────────────────────────────────────────────────────────
   ▸ url / anonKey : Supabase Dashboard → Project Settings → API
     (예약 사이트와 같은 프로젝트를 그대로 쓰면 됩니다)
   ▸ staffEmail / adminEmail : Authentication → Users 에 만들어 둔 계정
     ⚠ adminEmail 은 schema.sql 의 staff_is_admin() 안의 이메일과
       반드시 똑같아야 합니다.
   ▸ anon key 는 공개되어도 괜찮습니다. 로그인(비밀번호 게이트) 없이는
     RLS 가 모든 테이블을 막습니다.
   ═══════════════════════════════════════════════════════════════════ */
window.STAFF_CFG = {
  url:        'https://YOUR-PROJECT.supabase.co',
  anonKey:    'YOUR-ANON-KEY',
  staffEmail: 'staff@hanahayan.co.th',
  adminEmail: 'admin@hanahayan.co.th'
};
