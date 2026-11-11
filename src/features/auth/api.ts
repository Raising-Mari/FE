import { apiClient } from '@/api/client'
import type { components } from '@/api/generated/schema'

export type Me = components['schemas']['MeResponse']

/** A-06 내 정보. 로그인한 사람의 닉네임·학교·학과·역할을 돌려준다. */
export async function fetchMe(): Promise<Me> {
  const { data } = await apiClient.get<Me>('/api/me')
  return data
}
