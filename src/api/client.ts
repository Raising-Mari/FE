import axios, { isAxiosError } from 'axios'
import { env } from '@/lib/env'
import { useAuthStore } from '@/stores/authStore'
import { ApiError, NETWORK_ERROR_CODE, type ErrorResponse } from './errors'

/** 모든 서버 요청은 이 인스턴스로만 보낸다. 경로는 항상 '/api/...' 로 시작한다. */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30_000, // AI 호출이 들어가는 요청은 호출하는 쪽에서 더 길게 지정한다.
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError<Partial<ErrorResponse>>(error)) {
      if (error.response) {
        // 토큰을 보냈는데 401이면 만료·폐기된 것이다. 여기서 한 번만 로그아웃 처리하고, 로그인 화면으로 보내는 일은
        // 토큰이 사라진 것을 본 라우트 가드(app/guards.tsx)가 한다. (토큰 없이 부른 로그인 요청의 401은 해당 없음)
        if (error.response.status === 401 && error.config?.headers?.Authorization) {
          useAuthStore.getState().expire()
        }
        return Promise.reject(new ApiError(error.response.status, error.response.data ?? {}))
      }
      return Promise.reject(
        new ApiError(0, { code: NETWORK_ERROR_CODE, message: '서버에 연결할 수 없습니다.' }),
      )
    }
    return Promise.reject(error)
  },
)
