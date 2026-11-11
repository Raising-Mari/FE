import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { apiClient } from '@/api/client'
import { server } from '@/mocks/server'
import { useStatusPolling } from './useStatusPolling'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function usePoll() {
  return useStatusPolling({
    queryKey: ['battle', 1],
    queryFn: async () => (await apiClient.get<{ status: string }>('/api/battles/1')).data,
    isDone: (data) => ['FINISHED', 'CANCELED', 'EXPIRED'].includes(data.status),
    intervalMs: 30,
  })
}

describe('useStatusPolling', () => {
  it('끝 상태가 될 때까지 계속 조회하고, 끝나면 멈춘다', async () => {
    const statuses = ['WAITING', 'LOBBY', 'FINISHED']
    let calls = 0
    server.use(
      http.get('/api/battles/1', () => {
        const status = statuses[Math.min(calls, statuses.length - 1)]
        calls += 1
        return HttpResponse.json({ status })
      }),
    )
    const { result } = renderHook(usePoll, { wrapper })
    await waitFor(() => expect(result.current.data?.status).toBe('FINISHED'))
    const callsAtEnd = calls
    await sleep(150)
    expect(calls).toBe(callsAtEnd)
  })

  it('ERROR 상태는 끝이 아니라서 계속 조회한다(상대가 재시도하면 따라간다)', async () => {
    const statuses = ['RUNNING', 'ERROR', 'ERROR', 'RUNNING', 'FINISHED']
    let calls = 0
    server.use(
      http.get('/api/battles/1', () => {
        const status = statuses[Math.min(calls, statuses.length - 1)]
        calls += 1
        return HttpResponse.json({ status })
      }),
    )
    const { result } = renderHook(usePoll, { wrapper })
    await waitFor(() => expect(result.current.data?.status).toBe('FINISHED'), { timeout: 2000 })
    expect(calls).toBeGreaterThanOrEqual(5)
  })

  it('서버 오류(5xx)에서는 계속 시도한다', async () => {
    let calls = 0
    server.use(
      http.get('/api/battles/1', () => {
        calls += 1
        return HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'x' }, { status: 500 })
      }),
    )
    renderHook(usePoll, { wrapper })
    await waitFor(() => expect(calls).toBeGreaterThanOrEqual(3), { timeout: 2000 })
  })

  it('다시는 성공할 수 없는 오류(404)에서는 멈춘다', async () => {
    let calls = 0
    server.use(
      http.get('/api/battles/1', () => {
        calls += 1
        return HttpResponse.json({ code: 'NOT_FOUND', message: 'x' }, { status: 404 })
      }),
    )
    const { result } = renderHook(usePoll, { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
    const callsAtStop = calls
    await sleep(150)
    expect(calls).toBe(callsAtStop)
  })
})
