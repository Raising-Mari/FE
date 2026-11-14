# 마리 키우기 — FE

학생이 AI 제자 마리를 가르치고, 친구와 제자끼리 배틀하는 서비스의 웹 화면입니다. 데스크톱 전용(1440px 시안 기준)입니다.
React 19 · TypeScript · Vite · Tailwind CSS · TanStack Query · React Router

> 코드를 고치기 전에 [AGENTS.md](AGENTS.md)(전체 규칙)와, 고치려는 폴더의 `AGENTS.md`를 먼저 읽어 주세요.

## 준비물
- Node.js 22 이상 (`node -v`로 확인)

## 처음 실행하기
```bash
npm install
cp .env.example .env
npm run dev
```
http://localhost:5173 에 접속하면 홈 화면의 "서버 연결 상태"를 볼 수 있습니다.

### BE 서버와 연결하기
`/api`로 가는 요청은 개발 서버가 BE로 넘겨 줍니다. 기본 대상은 `http://localhost:8080`이고, 다른 서버(팀이 열어 둔 서버 등)를 쓰려면 `.env`의 `VITE_PROXY_TARGET`에 주소 앞부분만(`/api` 없이) 넣습니다.

Google 로그인을 쓰려면 `.env`에 `VITE_GOOGLE_CLIENT_ID`(팀에게 받음)를 넣습니다. 이 클라이언트의 "승인된 JavaScript 출처"에 `http://localhost:5173`이 등록돼 있어야 합니다.

### BE 없이 화면만 만들기
`.env`에서 `VITE_USE_MOCK=true`로 바꾸고 `npm run dev`를 다시 실행하면 [src/mocks/handlers.ts](src/mocks/handlers.ts)의 가짜 응답으로 동작합니다.

## 자주 쓰는 명령어
| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run typecheck` | 타입 검사 |
| `npm run lint` | 린트 |
| `npm run format` | 코드 형식 정리 |
| `npm test` | 테스트 |
| `npm run build` | 배포용 빌드 |
| `npm run gen:api` | BE의 Swagger로 API 타입 생성 (`localhost:8080`의 BE가 떠 있어야 함. 다른 서버는 `src/api/AGENTS.md` 참고) |

## 폴더 구조
```
src/
├─ app/          앱 시작점 (라우터, Provider)
├─ api/          서버 통신 공통부 (axios, 에러 타입, 자동 생성 타입)
├─ features/     기능별 화면·훅·API (home, auth, course, teaching, battle, review, ranking, styleguide[개발 전용])
├─ components/   공통 UI (ui/, layout/)
├─ hooks/        공통 훅
├─ stores/       전역 상태 (zustand)
├─ lib/          유틸·환경설정
├─ mocks/        MSW 목업
├─ styles/       전역 CSS
├─ types/        공통 타입
└─ test/         테스트 공통 설정
```

## 배포할 때
`main` 브랜치가 Vercel(`https://raising-mari.vercel.app`)에 배포됩니다.

**1. Vercel 환경변수 (Production)** — Vite는 값을 **빌드할 때** 코드에 박습니다. 바꾼 뒤에는 반드시 Redeploy 해야 반영됩니다.

| 변수 | 값 |
|---|---|
| `VITE_API_BASE_URL` | BE의 공개 https 주소 **앞부분만** (`https://…`). 끝 슬래시와 `/api`는 붙이지 않습니다 |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID (BE의 `GOOGLE_CLIENT_ID`와 같은 값) |
| `VITE_USE_MOCK` | 설정하지 않습니다. `true`면 운영에서 목업이 켜집니다 |

이 값들은 브라우저에 그대로 공개되므로 비밀값을 넣으면 안 됩니다. 두 변수가 비어 있으면 API 요청이 Vercel 자신(`/api/…`)으로 가서 전부 실패하고 로그인 버튼도 동작하지 않습니다.

**2. 새로고침·직접 주소** — `vercel.json`의 rewrite가 모든 경로를 `index.html`로 보냅니다. 지우면 `/login`, `/join/코드` 같은 주소를 바로 열 때 404가 납니다.

**3. BE·Google 쪽 설정** — FE 코드로는 할 수 없고 서버 관리자가 합니다.
- BE `.env`의 `CORS_ALLOWED_ORIGINS`에 `https://raising-mari.vercel.app`을 추가합니다(쉼표 구분, 끝 슬래시 없음). Vercel 미리보기 주소는 매번 달라 허용되지 않습니다.
- Google 클라이언트의 "승인된 JavaScript 출처"에 같은 주소를 추가합니다.

**4. 배포 뒤 점검**
```bash
# 딥링크가 모두 200 이어야 합니다
for P in / /login /courses /join/ABCD123; do curl -s -o /dev/null -w "$P %{http_code}\n" https://raising-mari.vercel.app$P; done
# 번들에 API 주소가 박혔는지 (빈 문자열이면 재배포가 필요합니다)
curl -s https://raising-mari.vercel.app/assets/<index-해시>.js | grep -oE 'apiBaseUrl:`[^`]*`'
```
전체 배포 절차와 진행 상태는 팀 공용 「배포 준비 계획서」를 따릅니다.
