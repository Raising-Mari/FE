import { createContext, useContext } from 'react'

export interface SignupSession {
  token: string
  expiresAt: number
}
export const SignupContext = createContext<{
  session: SignupSession | null
  setSession: (session: SignupSession | null) => void
} | null>(null)

export function useSignupSession() {
  const value = useContext(SignupContext)
  if (!value) throw new Error('SignupSessionProvider가 필요합니다.')
  return value
}
