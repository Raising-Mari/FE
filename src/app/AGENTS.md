# src/app/ — 앱 시작점

- `App.tsx`(조립) · `providers.tsx`(전역 Provider) · `router.tsx`(라우트 등록)만 둔다. **화면·기능 로직은 두지 않는다.**
- 라우트는 `router.tsx`에서만 등록한다. 기능 화면은 `features/<기능>/`에서 가져와 연결한다.
- 로그인이 필요한 라우트는 인증 가드 아래에 묶는다. (인증 전 사용자는 배틀·랭킹 접근 불가)
- Provider를 추가할 때는 순서가 의미 있으니 `providers.tsx`에서 주석으로 이유를 적는다.
