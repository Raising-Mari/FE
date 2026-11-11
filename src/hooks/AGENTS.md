# src/hooks/ — 공통 훅

- **두 개 이상의 기능이 같이 쓰는 훅만** 둔다. 한 기능 전용 훅은 `features/<기능>/hooks/`에 둔다.
- 파일명과 훅 이름은 `use`로 시작한다. (`useDebounce.ts`)
- 특정 도메인(배틀, 노트) 지식이 들어가는 훅은 여기에 두지 않는다.

## 지금 있는 훅
- `useStatusPolling`: 끝 상태가 될 때까지 2.5초마다 다시 조회한다. 끝 상태가 무엇인지(`isDone`)는 부르는 쪽이 정한다(배틀: `FINISHED`·`CANCELED`·`EXPIRED`, `ERROR`는 끝이 아니다 / 자료: `DONE`·`FAILED`). 5xx·연결 끊김은 계속 시도하고 4xx(429 제외)는 멈춘다. 탭이 가려져 있으면 쉰다.
