# AI 제자 — FE

학생이 AI 제자를 가르치고, 친구와 제자끼리 배틀하는 서비스의 웹 화면입니다.
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
`/api`로 가는 요청은 개발 서버가 BE로 넘겨 줍니다. 기본 대상은 `http://localhost:8080`이고, 다른 PC의 BE를 쓰려면 `.env`의 `VITE_PROXY_TARGET`을 바꿉니다.

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
| `npm run gen:api` | BE의 Swagger로 API 타입 생성 (BE가 떠 있어야 함) |

## 폴더 구조
```
src/
├─ app/          앱 시작점 (라우터, Provider)
├─ api/          서버 통신 공통부 (axios, 에러 타입, 자동 생성 타입)
├─ features/     기능별 화면·훅·API (home, auth, course, teaching, battle, review, ranking)
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
`VITE_API_BASE_URL`에 BE의 공개 주소(https)를 넣고 빌드합니다. 이 값은 브라우저에 그대로 공개되므로 비밀값을 넣으면 안 됩니다. BE 쪽 `CORS_ALLOWED_ORIGINS`에도 FE 주소를 추가해야 합니다.
