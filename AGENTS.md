# FE (프론트엔드) 규칙

AI 제자 서비스의 웹 화면. React 19 · TypeScript 7 · Vite 8 · Tailwind CSS 4 · TanStack Query · React Router 7.
이 파일은 FE 전체에 적용된다. **폴더마다 `AGENTS.md`가 따로 있으니, 그 폴더의 파일을 고치기 전에 해당 `AGENTS.md`를 먼저 읽는다.**
(Claude Code는 `CLAUDE.md`, Codex는 `AGENTS.md`를 읽는다. 내용은 `AGENTS.md` 한 곳에서만 고친다.)

## 실행 명령어
```bash
npm install            # 최초 1회
cp .env.example .env   # 최초 1회
npm run dev            # 개발 서버 → http://localhost:5173  (/api 는 BE 로 프록시)
npm run typecheck      # 타입 검사
npm run lint           # 린트 (oxlint)
npm run format         # 코드 정리 (prettier)
npm test               # 테스트 (vitest)
npm run build          # 배포용 빌드 (타입 검사 포함)
npm run gen:api        # BE 가 떠 있을 때 Swagger 에서 API 타입 생성
```
- BE 없이 화면을 만들려면 `.env`에서 `VITE_USE_MOCK=true`로 바꾼다 (MSW 목업).
- PR을 올리기 전에 `npm run typecheck && npm run lint && npm test`가 통과해야 한다.

## 폴더 구조 (`src/`)
| 폴더 | 역할 |
|---|---|
| `app/` | 앱 시작점: 라우터, 전역 Provider |
| `api/` | 서버 통신 공통부 (axios 인스턴스, 에러 타입, 자동 생성 타입) |
| `features/<기능>/` | 기능별 화면·훅·API 호출. **새 코드는 대부분 여기에 둔다** |
| `components/` | 여러 기능이 같이 쓰는 UI (`ui/` 버튼 등, `layout/` 전체 틀) |
| `hooks/` | 여러 기능이 같이 쓰는 훅 |
| `stores/` | 전역 상태 (zustand) — 로그인 정보처럼 정말 전역인 것만 |
| `lib/` | 순수 유틸·상수·환경설정 |
| `mocks/` | MSW 목업 (BE 없이 개발·테스트용) |
| `styles/` | 전역 CSS |
| `types/` | 여러 곳이 같이 쓰는 타입 |
| `test/` | 테스트 공통 설정 |

## 반드시 지키는 규칙
1. **서버 통신은 `api/client.ts`의 `apiClient`로만** 한다. 컴포넌트에서 `fetch`·`axios`를 직접 쓰지 않는다. 경로는 `/api/...`로 쓴다.
2. **서버에서 가져온 데이터는 TanStack Query**(`useQuery`/`useMutation`)로 다룬다. `useEffect`로 불러와 `useState`에 넣지 않는다.
3. **zustand에는 전역 클라이언트 상태만** 넣는다. 서버 데이터를 복사해 넣지 않는다.
4. 에러는 `ApiError`(`api/errors.ts`)의 `code`로 분기한다. 메시지 문자열을 비교하지 않는다.
5. 환경변수는 `lib/env.ts`를 통해서만 읽는다. `import.meta.env`를 여기저기서 쓰지 않는다. `VITE_` 값은 브라우저에 공개되니 **비밀값을 넣지 않는다.**
6. 의존 방향: `features` → `components`·`hooks`·`lib`·`api`. **`features`끼리 서로의 내부를 import하지 않는다.** 같이 쓸 것이 생기면 `components/`·`hooks/`·`lib/`로 올린다.
7. **API 타입은 손으로 쓰지 않고** BE의 Swagger에서 `npm run gen:api`로 만든다. (자동 생성 파일은 직접 고치지 않는다)
8. **모바일 우선**으로 만든다. 375px 폭에서 먼저 확인하고 넓은 화면으로 확장한다. 스타일은 Tailwind 클래스를 쓴다.
9. **학생에게 숨겨야 하는 정보**(문제 은행의 문항·정답·개념 목록)를 화면·상태·콘솔 로그에 올리지 않는다. 서버가 주지 않은 것을 추측해서 보여 주지도 않는다.
10. 새 API를 쓰는 화면을 만들면 `mocks/handlers.ts`에 같은 모양의 목업도 추가한다.

## 코드 스타일
- Prettier(`.prettierrc`)가 형식을 정한다: 세미콜론 없음, 작은따옴표, 2칸 들여쓰기. 직접 맞추지 말고 `npm run format`을 쓴다.
- 파일명: 컴포넌트는 `PascalCase.tsx`, 그 외는 `camelCase.ts`. 컴포넌트는 함수형, 파일 하나에 컴포넌트 하나가 기본.
- import 경로는 `@/`(= `src/`)를 쓴다. 같은 폴더 안은 상대경로(`./`)를 쓴다.
- `any`를 쓰지 않는다. 타입을 모르면 `unknown`으로 받고 좁힌다.
- 주석은 "왜 이렇게 했는지"만 적는다.
- 사용자에게 보이는 글은 한국어, 접근성(`aria-*`, `label`)을 챙긴다. 로딩·에러·빈 상태 화면을 반드시 만든다.

## 테스트
- 테스트 파일은 대상 옆에 `이름.test.tsx`로 둔다.
- 서버 응답은 MSW(`mocks/`)로 가짜를 쓴다. 실제 BE나 AI를 호출하지 않는다.
- 요소를 클래스명이 아니라 **사용자가 보는 텍스트·역할**(`getByRole`, `findByText`)로 찾는다.

## Git / 협업
- 브랜치: `main`(배포) ← `develop`(통합) ← `feat/<이슈번호>-<설명>`. `develop`·`main`에 직접 push하지 않는다.
- 커밋: `feat:` `fix:` `refactor:` `style:` `test:` `chore:` 로 시작한다.
- PR: 작게 쓰고 1명 이상 리뷰 후 머지한다. 화면 변경은 스크린샷(모바일 폭 포함)을 붙인다.
- API가 아직 없으면 BE 담당과 응답 모양을 먼저 합의하고 MSW 목업으로 진행한다.
- AI 도구(Claude Code·Codex)로 만든 코드는 PR 설명에 "AI 사용: 도구 / 용도"를 한 줄 남긴다. (대회 제작 기록 증빙)
