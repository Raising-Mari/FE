import { apiClient } from '@/api/client'
import type { components } from '@/api/generated/schema'

export type Me = components['schemas']['MeResponse']
export type GoogleLoginRequest = components['schemas']['GoogleLoginRequest']
export type GoogleLoginResponse = components['schemas']['GoogleLoginResponse']
export type SignupRequest = components['schemas']['SignupRequest']
export type SignupResponse = components['schemas']['SignupResponse']
export type Department = components['schemas']['DepartmentResponse']

export async function loginWithGoogle(input: GoogleLoginRequest): Promise<GoogleLoginResponse> {
  const { data } = await apiClient.post<GoogleLoginResponse>('/api/auth/google', input)
  return data
}

export async function signup(input: SignupRequest): Promise<SignupResponse> {
  const { data } = await apiClient.post<SignupResponse>('/api/auth/signup', input)
  return data
}

export async function fetchDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<Department[]>('/api/departments')
  return data
}

export async function checkNickname(nickname: string): Promise<boolean> {
  const { data } = await apiClient.get<components['schemas']['NicknameAvailabilityResponse']>(
    '/api/auth/nicknames/availability',
    { params: { nickname } },
  )
  return data.available === true
}

/** A-06 내 정보. 로그인한 사람의 닉네임·학교·학과·역할을 돌려준다. */
export async function fetchMe(): Promise<Me> {
  const { data } = await apiClient.get<Me>('/api/me')
  return data
}
