import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TOKEN_STORAGE_KEY, useAuthStore } from '@/stores/authStore'
import { DemoPanel, MOCK_ACCESS_TOKEN } from './DemoPanel'
import { DEFAULT_SCENARIO, useScenario } from './scenario'

function renderPanel() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <DemoPanel />
    </QueryClientProvider>,
  )
}

async function openPanel() {
  await userEvent.click(screen.getByRole('button', { name: '시연 도구' }))
}

beforeEach(() => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  useAuthStore.setState({ accessToken: null, sessionExpired: false })
  useScenario.setState(DEFAULT_SCENARIO)
})

describe('DemoPanel', () => {
  it('처음에는 닫혀 있고 누르면 열린다', async () => {
    renderPanel()
    const toggle = screen.getByRole('button', { name: '시연 도구' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('checkbox', { name: '관리자로 보기' })).not.toBeInTheDocument()

    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('checkbox', { name: '관리자로 보기' })).toBeInTheDocument()
  })

  it('로그인한 상태로 만들고 다시 로그아웃할 수 있다', async () => {
    renderPanel()
    await openPanel()
    await userEvent.click(screen.getByRole('button', { name: '로그인한 상태로 만들기' }))
    expect(useAuthStore.getState().accessToken).toBe(MOCK_ACCESS_TOKEN)

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('역할과 서버 연결을 바꾸고 처음 상태로 되돌린다', async () => {
    renderPanel()
    await openPanel()
    await userEvent.click(screen.getByRole('checkbox', { name: '관리자로 보기' }))
    await userEvent.click(screen.getByRole('checkbox', { name: '서버 연결 끊기' }))
    expect(useScenario.getState()).toMatchObject({ role: 'ADMIN', networkDown: true })

    await userEvent.click(screen.getByRole('button', { name: '처음 상태로' }))
    expect(useScenario.getState()).toMatchObject(DEFAULT_SCENARIO)
  })

  it('로그인 만료시키기는 로그인한 상태에서만 누를 수 있다', async () => {
    renderPanel()
    await openPanel()
    const expireButton = screen.getByRole('button', { name: '로그인 만료시키기' })
    expect(expireButton).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: '로그인한 상태로 만들기' }))
    expect(expireButton).toBeEnabled()
    await userEvent.click(expireButton)
    expect(useScenario.getState().tokenRejected).toBe(true)
  })
})
