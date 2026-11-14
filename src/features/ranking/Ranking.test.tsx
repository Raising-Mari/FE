import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockBattles } from '@/mocks/battleHandlers'
import { useAuthStore } from '@/stores/authStore'
import { renderApp } from '@/test/renderApp'

const section = async (name: string | RegExp) =>
  (await screen.findByRole('heading', { name })).closest('section')!

describe('배틀·연습 기록', () => {
  it('끝난 배틀을 보여 주고 복기로 연다', async () => {
    renderApp('/courses/1/records')
    const list = await screen.findByRole('list', { name: '배틀 기록' })
    const row = within(list).getAllByRole('listitem')[0]!
    expect(row).toHaveTextContent('1주차 기초')
    expect(row).toHaveTextContent('11월 7일 오후 08:24 · 완료 · 무 · 내 점수 0.00 · 상대 지우')
    expect(within(row).getByRole('link', { name: '열기' })).toHaveAttribute(
      'href',
      '/battles/1/review',
    )
  })

  it('연습만 골라 보면 없을 때 빈 상태를 보여 준다', async () => {
    renderApp('/courses/1/records')
    await screen.findByRole('list', { name: '배틀 기록' })
    await userEvent.click(screen.getByRole('button', { name: '연습' }))
    expect(await screen.findByText('아직 기록이 없어요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '연습' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('진행 중인 배틀은 그 방으로 연다', async () => {
    const room = mockBattles[1]!
    Object.assign(room, { status: 'LOBBY', me: { ...room.me, joined: true } })
    renderApp('/courses/1/records')
    const list = await screen.findByRole('list', { name: '배틀 기록' })
    expect(within(list).getAllByRole('link', { name: '열기' })[0]).toHaveAttribute(
      'href',
      '/battles/2',
    )
  })
})

describe('과목 랭킹', () => {
  it('Elo 순위·내 순위·성장폭·상대별 전적·Elo 변동을 보여 준다', async () => {
    renderApp('/courses/1/ranking')
    const elo = await section('Elo 순위')
    expect(await within(elo).findByText('내 순위 1위 · Elo 1000 · 1전')).toBeInTheDocument()
    expect(within(elo).getAllByRole('listitem')).toHaveLength(2)
    const growth = await section('성장폭 · 최근 7일')
    expect(await within(growth).findAllByText('+0')).toHaveLength(2)
    const records = await section('상대별 전적')
    expect(
      await within(records).findByText('0승 · 1무 · 0패', { exact: false }),
    ).toBeInTheDocument()
    const history = await section('내 Elo 변동')
    expect(await within(history).findByText(/1000 → 1000/)).toBeInTheDocument()
  })

  it('상대와의 배틀 목록을 펼쳐 복기로 갈 수 있다', async () => {
    renderApp('/courses/1/ranking')
    const records = await section('상대별 전적')
    await userEvent.click(await within(records).findByRole('button', { name: '배틀 목록 보기' }))
    const list = await within(records).findByRole('list', { name: '지우와의 배틀' })
    expect(list).toHaveTextContent('무 · 0.00 : 0.00')
    expect(within(list).getByRole('link', { name: '복기 열기' })).toHaveAttribute(
      'href',
      '/battles/1/review',
    )
  })

  it('배틀 전인 과목은 구역마다 빈 안내를 보여 준다', async () => {
    mockBattles.length = 0
    renderApp('/courses/1/ranking')
    expect(await screen.findByText(/아직 순위가 없어요/)).toBeInTheDocument()
    expect(await screen.findByText('아직 맞붙은 상대가 없어요.')).toBeInTheDocument()
  })
})

describe('내 정보', () => {
  it('닉네임을 바꿔 저장하면 헤더 이름도 바뀐다', async () => {
    renderApp('/me')
    const input = await screen.findByLabelText('닉네임')
    expect(input).toHaveValue('서연')
    expect(screen.getByRole('button', { name: '정보 저장' })).toBeDisabled()
    await userEvent.clear(input)
    await userEvent.type(input, '서연2')
    await userEvent.click(screen.getByRole('button', { name: '정보 저장' }))
    expect(await screen.findByText('정보를 저장했어요.')).toBeInTheDocument()
    expect(screen.getByText('서연2 님')).toBeInTheDocument()
  })

  it('이미 쓰는 닉네임이면 알려 준다', async () => {
    renderApp('/me')
    const input = await screen.findByLabelText('닉네임')
    await userEvent.clear(input)
    await userEvent.type(input, '사용중')
    await userEvent.click(screen.getByRole('button', { name: '정보 저장' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('이미 쓰고 있는 닉네임이에요.')
  })

  it('로그아웃하면 토큰을 지우고 로그인 화면으로 간다', async () => {
    const router = renderApp('/me')
    await userEvent.click(await screen.findByRole('button', { name: '로그아웃' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(useAuthStore.getState().accessToken).toBeNull()
  })
})
