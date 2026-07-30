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
  url:        'https://fxybjauokblmwhpupwzd.supabase.co',
  anonKey:    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4eWJqYXVva2JsbXdocHVwd3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMTIwNTMsImV4cCI6MjEwMDc4ODA1M30.f_eYGqaXb1B1K87MiRJPsq9s3e8Bpyb7ksGyAU6pZCs',
  staffEmail: 'staff@hanahayan.co.th',
  adminEmail: 'admin@hanahayan.co.th'
};
