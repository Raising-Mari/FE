import { create } from 'zustand'

/** 로그인 토큰을 담는 localStorage 키 하나. 새로고침해도 로그인을 유지하려고 저장한다(팀 결정). */
export const TOKEN_STORAGE_KEY = 'mari.accessToken'

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null // 저장소를 못 쓰는 환경(브라우저 설정 등)에서는 메모리에만 둔다.
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
    else localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // 저장에 실패해도 이번 탭에서는 메모리 값으로 계속 동작한다.
  }
}

interface AuthState {
  accessToken: string | null
  /** 서버가 토큰을 거부해(401) 로그아웃된 직후인가. 로그인 화면이 "로그인이 만료됐어요"를 보여 줄 때 쓴다. */
  sessionExpired: boolean
  /** 로그인 성공 때 토큰을 저장한다. 토큰을 지울 때는 `logout`을 쓴다. */
  setAccessToken: (token: string) => void
  /** 사용자가 직접 로그아웃. */
  logout: () => void
  /** 서버가 401로 토큰을 거부했을 때. 토큰을 지우고 만료 표시를 남긴다. */
  expire: () => void
  /** 로그인 화면이 만료 안내를 보여 준 뒤 표시를 끈다. */
  clearExpired: () => void
}

/** 로그인 정보처럼 앱 전체가 공유하는 값만 둔다. 서버에서 가져오는 데이터는 TanStack Query 로 다룬다. */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: readToken(),
  sessionExpired: false,
  setAccessToken: (token) => {
    writeToken(token)
    set({ accessToken: token, sessionExpired: false })
  },
  logout: () => {
    writeToken(null)
    set({ accessToken: null, sessionExpired: false })
  },
  expire: () => {
    writeToken(null)
    set({ accessToken: null, sessionExpired: true })
  },
  clearExpired: () => set({ sessionExpired: false }),
}))

// 다른 탭에서 로그인·로그아웃하면 이 탭도 따라간다.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== TOKEN_STORAGE_KEY) return
    useAuthStore.setState({ accessToken: event.newValue, sessionExpired: false })
  })
}
