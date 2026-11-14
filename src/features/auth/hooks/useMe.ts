import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { fetchMe } from '../api'

export const ME_QUERY_KEY = ['me'] as const

/**
 * 로그인한 사람의 정보. 토큰이 없으면 호출하지 않는다.
 * 헤더·가드·내 정보 화면이 같은 키를 쓰므로 한 번만 불러온다.
 */
export function useMe() {
  const hasToken = useAuthStore((s) => s.accessToken !== null)
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    enabled: hasToken,
    staleTime: 5 * 60_000,
  })
}
