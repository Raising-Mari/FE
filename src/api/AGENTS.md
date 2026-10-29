# src/api/ — 서버 통신 공통부

- `client.ts`: axios 인스턴스 하나. 요청에 토큰을 붙이고, 응답 에러를 `ApiError`로 바꾼다. **여기서만 axios를 설정한다.**
- `errors.ts`: BE의 `ErrorResponse`와 같은 모양. BE에서 에러 형식이 바뀌면 같이 고친다.
- 기능별 API 호출 함수는 여기가 아니라 `features/<기능>/api.ts`에 둔다.
- AI 호출이 들어가는 요청(가르치기, 배틀)은 오래 걸릴 수 있으니 호출하는 쪽에서 `timeout`을 더 길게 지정한다.
- 토큰이 만료돼 401이 오면 로그인 화면으로 보내는 처리는 이 폴더의 interceptor에서 한 곳으로 한다.
