import { apiClient } from '@/api/client'

export interface HealthResponse {
  status: string
  serverTime: string
}

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/api/health')
  return data
}
