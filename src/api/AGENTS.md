# src/api/ — 서버 통신 공통부

- `client.ts`: axios 인스턴스 하나. 요청에 토큰을 붙이고, 응답 에러를 `ApiError`로 바꾼다. **여기서만 axios를 설정한다.**
- `errors.ts`: BE의 `ErrorResponse`와 같은 모양. BE에서 에러 형식이 바뀌면 같이 고친다.
- `generated/`: 서버 Swagger에서 만든 API 타입(자동 생성, 직접 고치지 않는다). 만드는 법은 `generated/AGENTS.md`.
- `pending.ts`: **서버에 아직 없는 API**(`BE_변경_요청서.md` B절)의 임시 타입과 `TODO(BE)`. 서버에 올라오면 타입을 다시 만들고 해당 항목을 지운다. 명세에 모양이 없는 응답은 지어내지 않는다.
- 기능별 API 호출 함수는 여기가 아니라 `features/<기능>/api.ts`에 둔다.
- AI 호출이 들어가는 요청(가르치기, 배틀)은 오래 걸릴 수 있으니 호출하는 쪽에서 `timeout`을 더 길게 지정한다.
- 토큰이 만료돼 401이 오면 토큰을 지우고 로그인 화면으로 보내는 처리는 이 폴더의 interceptor에서 한 곳으로 한다.
