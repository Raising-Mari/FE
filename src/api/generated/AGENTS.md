# src/api/generated/ — 자동 생성 파일

> **이 폴더의 `.ts` 파일은 직접 고치지 않는다.**

- BE가 떠 있는 상태에서 `npm run gen:api`를 실행하면 Swagger(`/v3/api-docs`)로 `schema.d.ts`가 만들어진다.
- BE의 API가 바뀌었다는 알림을 받으면 다시 생성해서 함께 커밋한다. (타입이 달라져 컴파일 에러가 나면 FE가 맞춰 고친다)
- 생성 결과는 형식 검사(prettier)와 린트에서 제외돼 있다.
