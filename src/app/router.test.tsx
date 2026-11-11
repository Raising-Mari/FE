import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { DEFAULT_SCENARIO, useScenario } from '@/mocks/scenario'
import { server } from '@/mocks/server'
import { TOKEN_STORAGE_KEY, useAuthStore } from '@/stores/authStore'
import { routes } from './router'

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

function signIn() {
  useAuthStore.setState({ accessToken: 'test-token', sessionExpired: false })
}

beforeEach(() => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  useAuthStore.setState({ accessToken: null, sessionExpired: false })
  useScenario.setState(DEFAULT_SCENARIO)
})

describe('로그인 가드', () => {
  it('로그인하지 않고 로그인 영역을 열면 로그인 화면으로 보낸다', async () => {
    const router = renderAt('/courses/3/teach')
    expect(await screen.findByText('로그인 화면을 준비하고 있어요')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    // 로그인 뒤 돌아올 주소를 함께 넘긴다.
    expect(router.state.location.state).toEqual({ from: '/courses/3/teach' })
  })

  it('토큰이 만료돼 로그아웃되면 만료 안내를 보여 주고, 누르면 로그인 화면으로 간다', async () => {
    useAuthStore.setState({ accessToken: null, sessionExpired: true })
    const router = renderAt('/courses')
    expect(await screen.findByRole('heading', { name: '로그인이 만료됐어요' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '학교 Google 계정으로 로그인' }))
    expect(router.state.location.pathname).toBe('/login')
    expect(useAuthStore.getState().sessionExpired).toBe(false)
    expect(router.state.location.state).toEqual({ from: '/courses' })
  })

  it('화면을 보던 중 서버가 401 을 주면 만료 안내로 바뀐다', async () => {
    signIn()
    server.use(
      http.get('/api/me', () => HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 })),
    )
    renderAt('/courses')
    expect(await screen.findByRole('heading', { name: '로그인이 만료됐어요' })).toBeInTheDocument()
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })
})

describe('로그인 뒤 틀', () => {
  it('내 정보로 헤더 이름을 보여 주고 학생에게는 운영 메뉴를 숨긴다', async () => {
    signIn()
    renderAt('/courses')
    expect(await screen.findByText('서연 님')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: '주 메뉴' })
    expect(within(nav).getByRole('link', { name: /내 과목/ })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /내 정보/ })).toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: /운영·문제 점검/ })).not.toBeInTheDocument()
  })

  it('내 정보를 받는 동안 본문에 불러오는 중 표시를 보여 준다', async () => {
    signIn()
    renderAt('/courses')
    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중이에요')
    expect(await screen.findByText('서연 님')).toBeInTheDocument()
  })

  it('과목 주소에서는 그 과목의 메뉴가 나온다', async () => {
    signIn()
    renderAt('/courses/7/teach')
    const nav = await screen.findByRole('navigation', { name: '주 메뉴' })
    expect(within(nav).getByRole('link', { name: /과목 홈/ })).toHaveAttribute('href', '/courses/7')
    expect(within(nav).getByRole('link', { name: /가르치기/ })).toHaveAttribute(
      'href',
      '/courses/7/teach',
    )
    expect(within(nav).getByRole('link', { name: /가르치기/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('서버에 닿지 못하면 틀은 두고 본문에 안내와 다시 시도를 보여 준다', async () => {
    signIn()
    useScenario.setState({ networkDown: true })
    renderAt('/courses')
    expect(await screen.findByText('서버에 연결할 수 없어요')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: '주 메뉴' })).toBeInTheDocument()

    useScenario.setState({ networkDown: false })
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(await screen.findByText('서연 님')).toBeInTheDocument()
  })
})

describe('관리자 가드', () => {
  it('학생이 관리자 화면을 열면 권한 없음 안내를 본문에 보여 준다', async () => {
    signIn()
    renderAt('/admin')
    expect(await screen.findByText('관리자만 볼 수 있는 화면이에요')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '내 과목으로' })).toHaveAttribute('href', '/courses')
  })

  it('관리자는 메뉴가 보이고 관리자 화면에 들어간다', async () => {
    signIn()
    useScenario.setState({ role: 'ADMIN' })
    renderAt('/admin')
    expect(await screen.findByText('운영·문제 점검 화면을 준비하고 있어요')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: '주 메뉴' })
    expect(within(nav).getByRole('link', { name: /운영·문제 점검/ })).toBeInTheDocument()
  })
})

describe('없는 주소', () => {
  it('404 안내와 돌아갈 길 두 개를 보여 준다', async () => {
    renderAt('/no/such/page')
    expect(
      await screen.findByRole('heading', { name: '페이지를 찾을 수 없어요' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '내 과목으로 가기' })).toHaveAttribute(
      'href',
      '/courses',
    )
    expect(screen.getByRole('link', { name: '첫 화면으로' })).toHaveAttribute('href', '/')
  })
})
