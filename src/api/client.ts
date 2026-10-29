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
        return Promise.reject(new ApiError(error.response.status, error.response.data ?? {}))
      }
      return Promise.reject(
        new ApiError(0, { code: NETWORK_ERROR_CODE, message: '서버에 연결할 수 없습니다.' }),
      )
    }
    return Promise.reject(error)
  },
)
