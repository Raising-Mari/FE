/** import.meta.env 를 직접 쓰지 않고 이 객체를 통해서만 읽는다. */
export const env = {
  /** 비어 있으면 같은 출처(/api)로 요청한다. */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  /** 개발 서버로 열었을 때만 true. 스타일 가이드처럼 배포에 나가면 안 되는 화면을 가릴 때 쓴다. */
  isDev: import.meta.env.DEV,
} as const
