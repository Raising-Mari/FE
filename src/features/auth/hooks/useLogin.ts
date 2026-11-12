import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'
import { ApiError } from '@/api/errors'
import { readFromState } from '@/lib/redirectState'
import { useAuthStore } from '@/stores/authStore'
import { loginWithGoogle } from '../api'
import { useSignupSession } from '../useSignupSession'

export function useLogin() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useSignupSession()
  return useMutation({
    mutationFn: async (idToken: string) => {
      const result = await loginWithGoogle({ idToken })
      if (result.registered === true && result.accessToken) return result
      if (result.registered === false && result.signupToken) return result
      throw new ApiError(502, { code: 'INTERNAL_ERROR' })
    },
    onSuccess: (result) => {
      queryClient.clear()
      if (result.registered && result.accessToken) {
        useAuthStore.getState().setAccessToken(result.accessToken)
        navigate(readFromState(location.state) ?? '/courses', { replace: true })
      } else if (result.signupToken) {
        setSession({ token: result.signupToken, expiresAt: Date.now() + 10 * 60_000 })
        navigate('/signup', { replace: true, state: location.state })
      }
    },
  })
}
