import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'
import { routes } from '@/app/router'
import { resetCourseData } from '@/mocks/courseData'
import { DEFAULT_SCENARIO, useScenario } from '@/mocks/scenario'
import { server } from '@/mocks/server'
import { TOKEN_STORAGE_KEY, useAuthStore } from '@/stores/authStore'

vi.mock('@/lib/env', () => ({
  env: { isDev: true, useMock: true, apiBaseUrl: '', googleClientId: '' },
}))

function open(path = '/login') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ accessToken: null, sessionExpired: false })
  useScenario.setState(DEFAULT_SCENARIO)
  resetCourseData()
})

async function fillSignup() {
  await userEvent.click(await screen.findByRole('button', { name: '처음 가입하기 (목업)' }))
  await userEvent.type(await screen.findByLabelText('닉네임'), '새학생')
  await screen.findByText('사용 가능한 닉네임이에요.')
  await userEvent.selectOptions(screen.getByLabelText('학과'), '1')
}

it('처음 로그인하면 닉네임·학과·필수 동의 뒤 가입하고 토큰을 저장한다', async () => {
  const router = open()
  await fillSignup()
  expect(router.state.location.pathname).toBe('/signup')
  expect(localStorage.length).toBe(0)
  const submit = screen.getByRole('button', { name: '가입 완료' })
  expect(submit).toBeDisabled()
  await userEvent.click(screen.getByRole('checkbox', { name: /필수/ }))
  await userEvent.click(submit)
  expect(await screen.findByText('새학생 님')).toBeInTheDocument()
  expect(router.state.location.pathname).toBe('/courses')
  expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('mock-access-token')
  expect(localStorage.getItem('signupToken')).toBeNull()
})

it('기존 사용자는 로그인 전에 가려던 내부 주소로 돌아간다', async () => {
  const router = open('/courses/1/teach?unitId=1')
  await userEvent.click(await screen.findByRole('button', { name: '학교 Google 계정으로 로그인' }))
  await screen.findByText('가르치기 화면을 준비하고 있어요')
  expect(router.state.location.pathname + router.state.location.search).toBe(
    '/courses/1/teach?unitId=1',
  )
})

it('학교 밖 계정은 오류를 보여주고 로그인시키지 않는다', async () => {
  open()
  await userEvent.click(screen.getByRole('button', { name: '학교 외 계정 오류 확인 (목업)' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    '학교 Google 계정으로만 로그인할 수 있어요.',
  )
  expect(useAuthStore.getState().accessToken).toBeNull()
})

it('가입 토큰 없이 가입 주소를 열면 로그인으로 돌아간다', async () => {
  const router = open('/signup')
  await screen.findByRole('heading', { name: '로그인' })
  expect(router.state.location.pathname).toBe('/login')
})

it('중복 닉네임을 고친 뒤 다시 확인하고 가입할 수 있다', async () => {
  open()
  await userEvent.click(screen.getByRole('button', { name: '처음 가입하기 (목업)' }))
  const input = await screen.findByLabelText('닉네임')
  await userEvent.type(input, '사용중')
  await screen.findByText('이미 쓰고 있는 닉네임이에요.')
  expect(screen.getByRole('button', { name: '가입 완료' })).toBeDisabled()
  await userEvent.clear(input)
  await userEvent.type(input, '다른학생')
  await screen.findByText('사용 가능한 닉네임이에요.')
  await userEvent.selectOptions(screen.getByLabelText('학과'), '2')
  await userEvent.click(screen.getByRole('checkbox', { name: /필수/ }))
  await waitFor(() => expect(screen.getByRole('button', { name: '가입 완료' })).toBeEnabled())
})

it('서버가 가입 토큰 만료를 알리면 다시 로그인할 길을 보여준다', async () => {
  server.use(
    http.post('/api/auth/signup', () =>
      HttpResponse.json({ code: 'AUTH_SIGNUP_TOKEN_INVALID' }, { status: 401 }),
    ),
  )
  open()
  await fillSignup()
  await userEvent.click(screen.getByRole('checkbox', { name: /필수/ }))
  await userEvent.click(screen.getByRole('button', { name: '가입 완료' }))
  expect(await screen.findByRole('link', { name: '다시 로그인' })).toHaveAttribute('href', '/login')
  expect(useAuthStore.getState().accessToken).toBeNull()
})

it('로그인 성공 뒤 재접속해도 저장된 토큰으로 내 과목에 진입한다', async () => {
  useAuthStore.getState().setAccessToken('existing-token')
  const router = open('/login')
  await screen.findByRole('heading', { name: '나의 배움, 나의 제자.' })
  expect(router.state.location.pathname).toBe('/courses')
})
