# src/styles/ — 전역 CSS

- 전역 CSS는 `index.css` 하나(Tailwind 불러오기 + 폰트 + 디자인 토큰 + 기본 스타일)다. **화면별 스타일은 컴포넌트에서 Tailwind 클래스로** 쓴다.
- 색·글자 크기·모서리·그림자는 `index.css`의 `@theme`에 모아 둔 **토큰만** 쓴다(`bg-primary`, `text-ink`, `text-12`, `rounded-md`). Tailwind 기본 팔레트·크기는 비워 두었으니 `bg-slate-100`, `text-sm`, `#315a9b` 같은 값을 직접 쓰지 않는다. 시안에 없는 값이 필요하면 임의로 만들지 말고 디자인과 정한 뒤 토큰으로 추가한다.
- 토큰이 어느 시안 값에서 왔는지는 `docs/디자인 시스템 정리.md`, 화면으로 보려면 개발 서버의 `/styleguide`.
- 폰트는 **세방고딕 2.0**(`src/assets/fonts/`의 WOFF2 두 개: Regular, Bold)이다. 뒤에 시스템 한글 폰트가 대체용으로 붙어 있다. 굵기를 더 쓰려면(Light 등) 파일마다 약 290KB가 늘어나는 것을 감안한다.
