import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { TOKEN_STORAGE_KEY, useAuthStore } from '@/stores/authStore'
import { apiClient } from './client'
import { ApiError, NETWORK_ERROR_CODE } from './errors'

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ accessToken: null, sessionExpired: false })
})

describe('apiClient', () => {
  it('토큰이 있으면 Authorization 헤더로 보낸다', async () => {
    useAuthStore.getState().setAccessToken('token-1')
    let received: string | null = null
    server.use(
      http.get('/api/echo', ({ request }) => {
        received = request.headers.get('authorization')
        return HttpResponse.json({})
      }),
    )
    await apiClient.get('/api/echo')
    expect(received).toBe('Bearer token-1')
  })

  it('토큰을 보냈는데 401이 오면 토큰을 지우고 만료 표시를 남긴다', async () => {
    useAuthStore.getState().setAccessToken('token-1')
    server.use(
      http.get('/api/me', () =>
        HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
          { status: 401 },
        ),
      ),
    )
    await expect(apiClient.get('/api/me')).rejects.toBeInstanceOf(ApiError)
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().sessionExpired).toBe(true)
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('토큰 없이 부른 요청의 401은 만료로 보지 않는다(로그인 실패 등)', async () => {
    server.use(
      http.post('/api/auth/google', () =>
        HttpResponse.json(
          { code: 'AUTH_GOOGLE_TOKEN_INVALID', message: '토큰이 올바르지 않습니다.' },
          { status: 401 },
        ),
      ),
    )
    await expect(apiClient.post('/api/auth/google', { idToken: 'x' })).rejects.toMatchObject({
      status: 401,
      code: 'AUTH_GOOGLE_TOKEN_INVALID',
    })
    expect(useAuthStore.getState().sessionExpired).toBe(false)
  })

  it('401이 아닌 오류는 로그인을 유지한다', async () => {
    useAuthStore.getState().setAccessToken('token-1')
    server.use(
      http.get('/api/courses', () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR', message: '서버 내부 오류' }, { status: 500 }),
      ),
    )
    await expect(apiClient.get('/api/courses')).rejects.toMatchObject({ code: 'INTERNAL_ERROR' })
    expect(useAuthStore.getState().accessToken).toBe('token-1')
  })

  it('서버에 닿지 못하면 NETWORK_ERROR 코드의 ApiError 로 바꾼다', async () => {
    server.use(http.get('/api/health', () => HttpResponse.error()))
    await expect(apiClient.get('/api/health')).rejects.toMatchObject({
      status: 0,
      code: NETWORK_ERROR_CODE,
    })
  })
})
