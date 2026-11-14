# features/styleguide — 스타일 가이드 (개발 전용)

- `/styleguide` 한 화면. 색·글자·모서리·그림자 토큰과 `components/ui`·`components/layout` 부품을 한 번에 보여 준다.
- 라우트는 `lib/env.ts`의 `isDev`가 true일 때만 등록한다(`app/router.tsx`). 배포 화면이 아니다.
- 새 토큰이나 부품을 만들면 여기에도 한 줄 추가한다. 색 값은 화면에 그려진 실제 값을 읽어 보여 주므로 따로 적지 않는다.
- 서버 호출·전역 상태를 쓰지 않는다.
