# src/components/ — 공통 UI

**두 개 이상의 기능이 같이 쓰는 UI만** 둔다. 한 기능에서만 쓰면 `features/<기능>/components/`에 둔다.

## 규칙
- 이 폴더의 컴포넌트는 `features/`를 import하지 않는다. (의존 방향: `features` → `components`)
- 서버 호출·전역 상태를 직접 쓰지 않는다. 필요한 값은 props로 받는다.
- 하위 폴더: `ui/`(버튼·입력창 같은 작은 부품) · `layout/`(페이지 전체 틀)
