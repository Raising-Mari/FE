# src/features/ — 기능별 코드

기능 하나 = 폴더 하나. **새 코드는 대부분 여기에 둔다.**

```
features/<기능>/
├─ api.ts          이 기능의 서버 호출 함수 (apiClient 사용)
├─ hooks/          useQuery·useMutation 을 감싼 훅
├─ components/     이 기능에서만 쓰는 컴포넌트
└─ <이름>Page.tsx   라우트에 연결되는 화면
```

## 규칙
- **다른 기능의 내부 파일을 import하지 않는다.** 같이 쓸 것은 `components/`·`hooks/`·`lib/`로 올린다.
- 화면(`*Page.tsx`)은 데이터를 훅으로 받아 그리는 데 집중하고, 복잡한 계산은 `lib/`나 순수 함수로 뺀다.
- 서버 응답 타입은 `api/generated`의 타입을 쓴다. (아직 생성 전이면 임시 타입을 `api.ts`에 두고 TODO를 남긴다)
- 기능마다 화면 상태 4가지(로딩 / 에러 / 빈 상태 / 정상)를 모두 만든다.
- 현재 기능: `home` · `auth` · `course` · `teaching` · `battle` · `review` · `ranking` (각 폴더의 `AGENTS.md` 참고)
