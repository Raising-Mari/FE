import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockBattles, type MockBattle } from '@/mocks/battleHandlers'
import { mockNotes } from '@/mocks/teachingHandlers'
import { renderApp } from '@/test/renderApp'

/** 상대가 만들어 둔 대기 방(코드 MARI24)에 내가 들어간 상태로 만든다. */
function joinedRoom(patch: Partial<MockBattle> = {}) {
  const room = mockBattles.find((b) => b.roomCode === 'MARI24')!
  Object.assign(room, { status: 'LOBBY', me: { ...room.me, joined: true } }, patch)
  return room
}

describe('배틀 만들기', () => {
  it('내 노트 수와 안 본 문제 수를 보여 주고 방을 만들면 대기실로 간다', async () => {
    const router = renderApp('/courses/1/battle')
    expect(await screen.findByText('내 노트 4개 · 내가 안 본 문제 24개')).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('checkbox', { name: /노트 공개에 동의/ })[0]!)
    await userEvent.click(screen.getByRole('button', { name: '배틀 방 만들기' }))
    expect(await screen.findByText('상대 입장 대기')).toBeInTheDocument()
    expect(router.state.location.pathname).toMatch(/^\/battles\/\d+$/)
    expect(screen.getByRole('button', { name: '상대 입장을 기다려요' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '링크 복사' })).toBeInTheDocument()
  })

  it('내 노트가 없는 주차는 방을 만들 수 없고 가르치러 가기를 안내한다', async () => {
    mockNotes.length = 0
    renderApp('/courses/1/battle')
    // 목업의 주차 노트 수는 노트와 같이 움직이므로 직접 0으로 맞춘다.
    const { mockUnits } = await import('@/mocks/courseData')
    mockUnits.get(1)![0]!.myNoteCount = 0
    expect(await screen.findByText(/이 주차에 내 노트가 없어요/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '배틀 방 만들기' })).toBeDisabled()
    expect(screen.getByRole('link', { name: '먼저 가르치러 가기' })).toHaveAttribute(
      'href',
      '/courses/1/teach?unitId=1',
    )
  })

  it('진행 중인 방이 있으면 그 방으로 가는 길을 보여 준다', async () => {
    const room = joinedRoom()
    renderApp('/courses/1/battle')
    expect(await screen.findByRole('link', { name: '진행 중인 방으로' })).toHaveAttribute(
      'href',
      `/battles/${room.id}`,
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '배틀 방 만들기' })).toBeDisabled(),
    )
  })

  it('방 코드는 공백·소문자를 정리해 보내고, 없는 방이면 안내한다', async () => {
    const router = renderApp('/courses/1/battle')
    const code = await screen.findByLabelText('방 코드')
    await userEvent.type(code, 'zzzzzz')
    await userEvent.click(screen.getByRole('button', { name: '입장하기' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('없는 방이에요')
    await userEvent.clear(code)
    await userEvent.type(code, ' mari24 ')
    await userEvent.click(screen.getByRole('button', { name: '입장하기' }))
    expect(await screen.findByRole('button', { name: '준비 완료' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/battles/2')
  })
})

describe('링크 입장', () => {
  it('/join/코드 로 열면 바로 입장해 대기실로 간다', async () => {
    const router = renderApp('/join/mari24')
    expect(await screen.findByRole('button', { name: '준비 완료' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/battles/2')
  })

  it('노트가 없어 못 들어가면 그 주차를 가르치러 가도록 안내한다', async () => {
    mockNotes.length = 0
    renderApp('/join/MARI24')
    expect(await screen.findByRole('alert')).toHaveTextContent('‘1주차 기초’에 내 노트가 없어요')
    expect(screen.getByRole('link', { name: '가르치러 가기' })).toHaveAttribute(
      'href',
      '/courses/1/teach?unitId=1',
    )
  })
})

describe('배틀 대기실', () => {
  it('준비 완료를 누르면 고른 공개 동의를 함께 보내고 노트가 확정됐다고 알려 준다', async () => {
    const room = joinedRoom()
    renderApp(`/battles/${room.id}`)
    await userEvent.click(await screen.findByRole('checkbox', { name: /노트 공개에 동의/ }))
    await userEvent.click(screen.getByRole('button', { name: '준비 완료' }))
    expect(await screen.findByText(/내 노트가 확정됐어요/)).toBeInTheDocument()
    expect(room.myNotesPublic).toBe(true)
    expect(room.noteSnapshot).toHaveLength(4)
  })

  it('풀이 중에는 문제 없이 기다리는 화면만 보여 준다', async () => {
    const room = joinedRoom({ status: 'RUNNING', polls: -99 })
    renderApp(`/battles/${room.id}`)
    expect(await screen.findByText('마리가 문제를 풀고 있어요')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /취소|준비/ })).not.toBeInTheDocument()
  })

  it('오류면 다시 시도와 포기하고 나가기를 고를 수 있다', async () => {
    const room = joinedRoom({ status: 'ERROR' })
    renderApp(`/battles/${room.id}`)
    expect(await screen.findByRole('alert')).toHaveTextContent('레이팅은 바뀌지 않았어요')
    await userEvent.click(screen.getByRole('button', { name: '포기하고 나가기' }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: '포기하기' }),
    )
    expect(await screen.findByText('취소된 방이에요')).toBeInTheDocument()
    expect(room.status).toBe('CANCELED')
  })

  it('오류에서 다시 시도하면 풀이 중으로 돌아간다', async () => {
    const room = joinedRoom({ status: 'ERROR', polls: -99 })
    renderApp(`/battles/${room.id}`)
    await userEvent.click(await screen.findByRole('button', { name: '다시 시도' }))
    expect(await screen.findByText('마리가 문제를 풀고 있어요')).toBeInTheDocument()
  })

  it('끝난 랭킹 배틀은 결과·복기로 옮긴다', async () => {
    const router = renderApp('/battles/1')
    await waitFor(() => expect(router.state.location.pathname).toBe('/battles/1/review'))
  })

  it('남의 방이나 없는 방이면 찾을 수 없다고 알려 준다', async () => {
    renderApp('/battles/999')
    expect(await screen.findByRole('alert')).toHaveTextContent('찾을 수 없는 내용이에요')
  })
})
