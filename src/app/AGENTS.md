# src/app/ — 앱 시작점

- `App.tsx`(조립) · `providers.tsx`(전역 Provider) · `router.tsx`(라우트 등록) · `guards.tsx`(로그인·관리자 가드) · `layouts.tsx`(로그인 전·후 틀) · `ToastViewport.tsx`(알림 표시)만 둔다. **화면·기능 로직은 두지 않는다.**
- 라우트는 `router.tsx`에서만 등록한다. 기능 화면은 `features/<기능>/`에서 가져와 연결한다.
- 로그인이 필요한 라우트는 `RequireAuth` → `ProtectedLayout` 아래에 묶는다(인증 전 사용자는 배틀·랭킹 접근 불가). 토큰이 없으면 `/login`, 만료로 지워졌으면 `/session-expired`로 보내고 돌아올 주소를 `location.state`로 넘긴다. 관리자 화면은 그 안에서 `RequireAdmin`으로 다시 묶는다(역할은 `useMe`로만 판단).
- 주소는 `FE/docs/확정 개발 계획서.md` 부록 A를 따른다. 아직 없는 화면은 `router.tsx`의 `soon(...)` 자리표시이고, 화면을 만들 때마다 실제 페이지로 바꾼다.
- `ToastViewport`가 이 폴더에 있는 이유: `components/`는 전역 상태를 쓰지 않는 규칙이라, `toastStore`를 읽는 부분만 여기 둔다.
- `DemoPanel`(시연 도구)은 `env.useMock`일 때만 `App`이 불러온다.
- Provider를 추가할 때는 순서가 의미 있으니 `providers.tsx`에서 주석으로 이유를 적는다.
