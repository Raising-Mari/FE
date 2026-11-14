import { TOKEN_STORAGE_KEY, useAuthStore } from './authStore'

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ accessToken: null, sessionExpired: false })
})

describe('authStore', () => {
  it('로그인하면 토큰을 localStorage 한 키에 저장한다', () => {
    useAuthStore.getState().setAccessToken('token-1')
    expect(useAuthStore.getState().accessToken).toBe('token-1')
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('token-1')
  })

  it('로그아웃하면 토큰을 지우고 만료 표시는 남기지 않는다', () => {
    useAuthStore.getState().setAccessToken('token-1')
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().sessionExpired).toBe(false)
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('만료되면 토큰을 지우고 만료 표시를 남긴다', () => {
    useAuthStore.getState().setAccessToken('token-1')
    useAuthStore.getState().expire()
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().sessionExpired).toBe(true)
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('다시 로그인하면 만료 표시가 꺼진다', () => {
    useAuthStore.getState().expire()
    useAuthStore.getState().setAccessToken('token-2')
    expect(useAuthStore.getState().sessionExpired).toBe(false)
  })

  it('다른 탭에서 토큰이 바뀌면 따라간다', () => {
    window.dispatchEvent(
      new StorageEvent('storage', { key: TOKEN_STORAGE_KEY, newValue: 'from-other-tab' }),
    )
    expect(useAuthStore.getState().accessToken).toBe('from-other-tab')
    window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_STORAGE_KEY, newValue: null }))
    expect(useAuthStore.getState().accessToken).toBeNull()
  })
})
