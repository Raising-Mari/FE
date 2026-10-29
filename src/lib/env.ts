/** import.meta.env 를 직접 쓰지 않고 이 객체를 통해서만 읽는다. */
export const env = {
  /** 비어 있으면 같은 출처(/api)로 요청한다. */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
} as const
