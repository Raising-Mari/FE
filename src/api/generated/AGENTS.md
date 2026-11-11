# src/api/generated/ — 자동 생성 파일

> **이 폴더의 `.ts` 파일은 직접 고치지 않는다.**

- BE가 `localhost:8080`에 떠 있으면 `npm run gen:api`로 Swagger(`/v3/api-docs`)에서 `schema.d.ts`를 만든다.
- 다른 서버(팀이 열어 둔 서버 등)에서 만들 때는 주소를 직접 준다:
  `npx --yes openapi-typescript@7 <서버 주소>/v3/api-docs -o src/api/generated/schema.d.ts`
- BE의 API가 바뀌었다는 알림을 받으면 다시 생성해서 함께 커밋한다. (타입이 달라져 컴파일 에러가 나면 FE가 맞춰 고친다)
- 생성 결과는 형식 검사(prettier)와 린트에서 제외돼 있다.
- 마지막 생성: 2026-11-11, 열어 둔 서버(경로 49개). 서버에 없는 API 7개는 `../pending.ts`에 있다.
