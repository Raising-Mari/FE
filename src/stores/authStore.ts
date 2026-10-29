import { create } from 'zustand'

interface AuthState {
  accessToken: string | null
  setAccessToken: (token: string | null) => void
}

/** 로그인 정보처럼 앱 전체가 공유하는 값만 둔다. 서버에서 가져오는 데이터는 TanStack Query 로 다룬다. */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
}))
