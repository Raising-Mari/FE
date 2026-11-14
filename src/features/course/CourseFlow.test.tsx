import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/app/router'
import { mockDisciples, mockUnits, resetCourseData } from '@/mocks/courseData'
import { DEFAULT_SCENARIO, useScenario } from '@/mocks/scenario'
import { server } from '@/mocks/server'
import { useAuthStore } from '@/stores/authStore'

function open(path = '/courses') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
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
  useAuthStore.setState({ accessToken: 'test-token', sessionExpired: false })
  useScenario.setState(DEFAULT_SCENARIO)
  resetCourseData()
})

it('과목 생성 → 제자 생성 → 주차 생성 흐름이 연결되고 목록이 갱신된다', async () => {
  const router = open()
  await userEvent.click(await screen.findByRole('button', { name: '＋ 새 과목 만들기' }))
  await userEvent.type(screen.getByLabelText('과목 이름'), '알고리즘')
  await screen.findByText('검색 결과가 없어요. 새 과목을 만들 수 있어요.')
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: '새 과목 만들기' }),
  )
  await userEvent.click(await screen.findByRole('button', { name: '나의 제자 만들기' }))
  await userEvent.clear(screen.getByLabelText('제자 이름'))
  await userEvent.type(screen.getByLabelText('제자 이름'), '콩이')
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: '제자 만들기' }),
  )
  await screen.findByRole('heading', { name: '나의 제자 · 콩이' })
  await userEvent.click(screen.getByRole('button', { name: '＋ 주차 만들기' }))
  await userEvent.type(screen.getByLabelText('주차 이름'), '1주차 정렬')
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: '주차 만들기' }),
  )
  await screen.findByText('가르치기 화면을 준비하고 있어요')
  expect(router.state.location.pathname).toBe('/courses/3/teach')
  expect(router.state.location.search).toMatch(/unitId=\d+/)
  expect(mockDisciples.get(3)?.name).toBe('콩이')
  expect(mockUnits.get(3)?.[0]?.title).toBe('1주차 정렬')
})

it('기존 과목 검색 뒤 참여 확인을 거쳐 제자 만들기로 간다', async () => {
  const router = open()
  await userEvent.click(await screen.findByRole('button', { name: '＋ 새 과목 만들기' }))
  await userEvent.type(screen.getByLabelText('과목 이름'), '운영체제')
  await userEvent.click(await screen.findByRole('button', { name: '운영체제 · 2026-2 → 선택' }))
  expect(screen.getByRole('dialog')).toHaveTextContent('제자를 만들면 내 과목에 추가돼요.')
  await userEvent.click(screen.getByRole('button', { name: '제자 만들기로' }))
  await screen.findByRole('button', { name: '나의 제자 만들기' })
  expect(router.state.location.pathname).toBe('/courses/2')
})

it('다른 탭에서 이미 제자를 만들었으면 최신 제자를 다시 불러온다', async () => {
  server.use(
    http.post('/api/courses/2/disciple', () => {
      mockDisciples.set(2, { id: 2, courseId: 2, name: '먼저만든마리', characterKey: 'mari' })
      return HttpResponse.json({ code: 'DISCIPLE_ALREADY_EXISTS' }, { status: 409 })
    }),
  )
  open('/courses/2')
  await userEvent.click(await screen.findByRole('button', { name: '나의 제자 만들기' }))
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: '제자 만들기' }),
  )
  expect(
    await screen.findByRole('heading', { name: '나의 제자 · 먼저만든마리' }),
  ).toBeInTheDocument()
})

it('서버가 과목 중복을 반환해도 기존 과목으로 이동한다', async () => {
  server.use(
    http.post('/api/courses', () =>
      HttpResponse.json(
        { code: 'COURSE_DUPLICATE', details: { existingCourseId: 2 } },
        { status: 409 },
      ),
    ),
  )
  const router = open()
  await userEvent.click(await screen.findByRole('button', { name: '＋ 새 과목 만들기' }))
  await userEvent.type(screen.getByLabelText('과목 이름'), '운영체제')
  await screen.findByRole('button', { name: '운영체제 · 2026-2 → 선택' })
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: '새 과목 만들기' }),
  )
  await screen.findByRole('button', { name: '나의 제자 만들기' })
  expect(router.state.location.pathname).toBe('/courses/2')
})

it.each(['teach', 'battle'])('제자 없는 과목은 %s 주소 직접 접근도 차단한다', async (path) => {
  open(`/courses/2/${path}`)
  expect(await screen.findByText('제자를 먼저 만들어주세요')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '제자 만들러 가기' })).toHaveAttribute(
    'href',
    '/courses/2',
  )
})

it('이름이 같은 주차는 새로 만들지 않고 기존 주차로 이동한다', async () => {
  const router = open('/courses/1')
  await userEvent.click(await screen.findByRole('button', { name: '＋ 주차 만들기' }))
  await userEvent.type(screen.getByLabelText('주차 이름'), '1주차 기초')
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: '주차 만들기' }),
  )
  await waitFor(() => expect(router.state.location.search).toBe('?unitId=1'))
  expect(mockUnits.get(1)).toHaveLength(1)
})

it('마지막 과목은 내 과목 화면에서도 선택 상태를 유지한다', async () => {
  localStorage.setItem('mari.lastCourseId', '1')
  open()
  await waitFor(() => expect(screen.getByLabelText('MY CLASSROOM')).toHaveValue('1'))
  expect(
    within(screen.getByRole('navigation', { name: '주 메뉴' })).getByRole('link', {
      name: /과목 홈/,
    }),
  ).toHaveAttribute('href', '/courses/1')
})

it('참여한 과목이 없으면 시작할 수 있는 빈 상태를 보여준다', async () => {
  mockDisciples.clear()
  open()
  expect(await screen.findByText('아직 참여한 과목이 없어요')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '과목 찾아보기' })).toBeEnabled()
})

it('검색 실패 중에는 새 과목 생성이 막히며 다시 시도할 수 있다', async () => {
  server.use(
    http.get('/api/courses', () => HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 })),
  )
  open()
  await userEvent.click(await screen.findByRole('button', { name: '＋ 새 과목 만들기' }))
  await userEvent.type(screen.getByLabelText('과목 이름'), '운영체제')
  await screen.findByText('서버에 문제가 생겼어요. 잠시 뒤에 다시 시도해 주세요.')
  expect(
    within(screen.getByRole('dialog')).getByRole('button', { name: '새 과목 만들기' }),
  ).toBeDisabled()
  expect(screen.getByRole('button', { name: '다시 시도' })).toBeEnabled()
})
