import { useQuery, type QueryKey } from '@tanstack/react-query'
import { ApiError } from '@/api/errors'

/** 배틀·자료 처리처럼 서버가 상태를 바꿔 가는 값을 확인하는 간격. (웹소켓 없이 폴링, 2~3초) */
export const POLL_INTERVAL_MS = 2500

interface StatusPollingOptions<T> {
  queryKey: QueryKey
  queryFn: () => Promise<T>
  /** 끝 상태이면 true. 이때부터 폴링을 멈춘다. (예: 배틀 `FINISHED`·`CANCELED`·`EXPIRED`, 자료 `DONE`·`FAILED`) */
  isDone: (data: T) => boolean
  intervalMs?: number
  enabled?: boolean
}

/**
 * 끝 상태가 될 때까지 일정한 간격으로 다시 조회한다.
 * - 끝 상태가 아니면 계속한다. 배틀의 `ERROR`는 끝 상태가 아니다(상대가 재시도하거나 포기하는 것을 따라가야 한다).
 * - 일시적인 오류(서버 5xx·연결 끊김)에서는 계속 시도하고, 다시는 성공할 수 없는 오류(4xx: 없는 방·권한 없음 등)에서는 멈춘다.
 * - 탭이 가려져 있는 동안은 쉬고, 다시 보이면 바로 한 번 조회한다.
 */
export function useStatusPolling<T>({
  queryKey,
  queryFn,
  isDone,
  intervalMs = POLL_INTERVAL_MS,
  enabled = true,
}: StatusPollingOptions<T>) {
  return useQuery({
    queryKey,
    queryFn,
    enabled,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      if (isPermanentError(query.state.error)) return false
      if (query.state.data !== undefined && isDone(query.state.data)) return false
      return intervalMs
    },
  })
}

/** 429(사용량 제한)를 뺀 4xx 는 기다려도 나아지지 않는다. */
function isPermanentError(error: unknown): boolean {
  return (
    error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 429
  )
}
