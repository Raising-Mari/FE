import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { HomePage } from './HomePage'

function renderHome() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>,
  )
}

describe('HomePage', () => {
  it('서버가 응답하면 연결됨을 보여 준다', async () => {
    renderHome()
    expect(await screen.findByText(/연결됨/)).toBeInTheDocument()
  })

  it('서버 오류면 실패 메시지를 보여 준다', async () => {
    server.use(
      http.get('/api/health', () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR', message: '서버 내부 오류' }, { status: 500 }),
      ),
    )
    renderHome()
    expect(await screen.findByText(/연결 실패/)).toBeInTheDocument()
  })
})
