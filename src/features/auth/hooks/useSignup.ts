import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'
import { ApiError } from '@/api/errors'
import { readFromState } from '@/lib/redirectState'
import { useAuthStore } from '@/stores/authStore'
import { checkNickname, fetchDepartments, signup, type SignupRequest } from '../api'

export function useDepartments() {
  return useQuery({ queryKey: ['departments'], queryFn: fetchDepartments, staleTime: 5 * 60_000 })
}

export function useNicknameAvailability(nickname: string) {
  return useQuery({
    queryKey: ['nickname', nickname],
    queryFn: () => checkNickname(nickname),
    enabled: /^[가-힣a-zA-Z0-9_]{2,12}$/.test(nickname),
    staleTime: 0,
    retry: false,
  })
}

export function useSignup() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async (input: SignupRequest) => {
      const result = await signup(input)
      if (!result.accessToken) throw new ApiError(502, { code: 'INTERNAL_ERROR' })
      return result.accessToken
    },
    onSuccess: (token) => {
      queryClient.clear()
      useAuthStore.getState().setAccessToken(token)
      navigate(readFromState(location.state) ?? '/courses', { replace: true })
    },
  })
}
