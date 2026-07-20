# Vercel 배포 가이드 (5분)

## 1. Vercel 가입 & 프로젝트 임포트
1. https://vercel.com → **Sign up with GitHub** (witanellie-wq 계정)
2. **Add New → Project** → `witanellie-wq/sajuth` 선택 → **Import**
3. 설정 화면에서 딱 하나만 바꾸면 됨:
   - **Root Directory** → `webapp` 으로 변경 (Edit 버튼)
   - Framework는 Next.js로 자동 인식됨
4. 배포할 브랜치: 기본은 main. 지금 코드는 `claude/saju-thailand-site-x10hb9`
   브랜치에 있으니, main에 머지하거나 Vercel 프로젝트 Settings → Git →
   Production Branch를 이 브랜치로 지정.

## 2. 환경변수 (Settings → Environment Variables)
`.env.example` 참고. 최소 셋업:

| 변수 | 값 | 필수 |
|---|---|---|
| `PROMPTPAY_TARGET` | 본인 프롬프트페이 전화번호 (예: 0812345678) | 결제용 |
| `UNLOCK_PRICE_THB` | 59 | 선택 (기본 59) |
| `UNLOCK_COMPAT_PRICE_THB` | 89 | 선택 (기본 89) |
| `ANTHROPIC_API_KEY` | sk-ant-... | 선택 (해석 자연화) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Supabase 프로젝트에서 | **프로덕션 필수** |

> ⚠️ Supabase 없이 배포하면 서버리스 특성상 공유링크/결제상태가
> 유지되지 않음 (인메모리 폴백은 로컬 개발용). 프로덕션은 Supabase 연결 필수.

## 3. Supabase 셋업 (무료, 3분)
1. https://supabase.com → New project
2. SQL Editor에서 실행:
```sql
create table readings (
  id uuid primary key,
  created_at timestamptz not null default now(),
  input jsonb not null,
  chart jsonb not null,
  sections jsonb not null,
  paid boolean not null default false
);
create table compat_readings (
  id uuid primary key,
  created_at timestamptz not null default now(),
  charts jsonb not null,
  result jsonb not null,
  paid boolean not null default false
);
```
3. Settings → API에서 URL과 `service_role` 키 복사 → Vercel 환경변수에 입력

## 4. Deploy
**Deploy** 버튼 → 1~2분 후 `https://<project>.vercel.app` 발급.
이후 브랜치에 push할 때마다 자동 재배포.

## 커스텀 도메인 (선택)
Settings → Domains에서 `sajucode.com` 등 연결 (PLAN.md 참고).
