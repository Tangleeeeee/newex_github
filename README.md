# newex — 매일 새로운 경험 기록

> 하루에 하나씩, 안 해봤던 새로운 경험을 친구들과 함께 기록하는 웹서비스

## 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM (v5)
- **인증**: NextAuth.js v4 (이메일/비밀번호 + Google OAuth)
- **파일 업로드**: Cloudinary
- **이메일**: Resend
- **스케줄러**: node-cron

## 시작하기

### 1. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 아래 값들을 채워주세요:

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | Supabase PostgreSQL 연결 문자열 |
| `NEXTAUTH_SECRET` | 랜덤 32자 문자열 (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | 배포 URL (로컬: `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Google Cloud Console OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console OAuth 클라이언트 Secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary 클라우드 이름 |
| `CLOUDINARY_API_KEY` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret |
| `RESEND_API_KEY` | Resend API Key |
| `EMAIL_FROM` | 발신 이메일 주소 |
| `NEXT_PUBLIC_BASE_URL` | 앱 기본 URL |

### 2. 의존성 설치

```bash
npm install
```

### 3. DB 마이그레이션

```bash
npx prisma migrate dev --name init
```

### 4. 개발 서버 실행

```bash
npm run dev
```

## 프로젝트 구조

```
newex/
├── app/
│   ├── (auth)/login/          # 로그인/회원가입
│   ├── write/                 # 경험 작성 (매일 강제 진입)
│   ├── feed/                  # 그룹 피드
│   ├── profile/               # 개인 프로필 & 캘린더
│   ├── hall-of-fame/          # 명예의 전당
│   │   └── select/            # 말일 강제 선택 팝업
│   ├── report/
│   │   ├── monthly/[year]/[month]/  # 월간 리포트
│   │   └── annual/[year]/           # 연간 리포트
│   ├── group/create/          # 그룹 생성
│   ├── group/join/            # 그룹 참여
│   └── api/                   # API Routes
├── components/
│   ├── StarRating.tsx         # 커스텀 별점 (0.5단위)
│   ├── Navbar.tsx             # 상단 네비게이션
│   └── ExperienceCard.tsx     # 경험 카드
├── lib/
│   ├── auth.ts                # NextAuth 설정
│   ├── prisma.ts              # Prisma 클라이언트
│   ├── cloudinary.ts          # 이미지 업로드
│   ├── email.ts               # 이메일 발송 (Resend)
│   ├── cron.ts                # Cron 스케줄러
│   ├── dateUtils.ts           # KST 날짜 계산 유틸
│   └── constants.ts           # 카테고리 레이블 등
├── prisma/schema.prisma       # DB 스키마
├── middleware.ts              # 접근 제어 미들웨어
└── .env.example
```

## 핵심 비즈니스 로직

- **날짜 기준**: 00:00~01:59 → 전날, 02:00~23:59 → 당일 (KST)
- **강제 라우팅**: 미등록 시 `/write`, 말일 명예의 전당 미선택 시 `/hall-of-fame/select`
- **경험 불변**: 등록 후 수정/삭제 불가
- **Cron**: 매일 01:00 독촉 이메일, 매월 말일 23:00 월간 리포트, 매년 12/31 23:30 연간 리포트

## 배포 (Vercel + Supabase)

1. Supabase에서 PostgreSQL 데이터베이스 생성
2. `DATABASE_URL` 설정 후 `npx prisma migrate deploy`
3. Vercel에 환경변수 설정 후 배포
