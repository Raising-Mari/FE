import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { SignupContext, type SignupSession } from './useSignupSession'

/** 가입 토큰은 URL이나 브라우저 저장소에 남기지 않는다. 새로고침하면 다시 로그인한다. */
export function SignupSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SignupSession | null>(null)
  const { pathname } = useLocation()
  const [previousPath, setPreviousPath] = useState(pathname)
  if (previousPath !== pathname) {
    setPreviousPath(pathname)
    if (pathname !== '/signup') setSession(null)
  }
  return <SignupContext.Provider value={{ session, setSession }}>{children}</SignupContext.Provider>
}
