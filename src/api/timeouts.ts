/** 보통 요청은 `client.ts`의 기본값(30초)을 쓴다. */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000

/**
 * AI 호출이 들어가는 요청(가르치기 메시지 전송, 풀이 재시도 등)용. 서버 AI 응답은 보통 몇 초지만
 * 서버 측 기록에서 최대 54초까지 걸린 적이 있어 그보다 길게 잡았다. `apiClient.post(url, body, { timeout })`로 넘긴다.
 */
export const AI_REQUEST_TIMEOUT_MS = 90_000
