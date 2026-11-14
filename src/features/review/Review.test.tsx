import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockBattles } from '@/mocks/battleHandlers'
import { useScenario } from '@/mocks/scenario'
import { renderApp } from '@/test/renderApp'

const battle = () => mockBattles[0]!
const firstItem = async () =>
  (await screen.findByRole('heading', { name: /^1\. 배열 스택이 가득 찼을 때/ })).closest(
    'article',
  )!

describe('결과·복기', () => {
  it('점수·Elo 와 문항별 제자 답을 보여 주고 정답은 숨긴다', async () => {
    renderApp('/battles/1/review')
    expect(await screen.findByText('무승부')).toBeInTheDocument()
    expect(screen.getByLabelText('내 점수 대 상대 점수')).toHaveTextContent('0.00 : 0.00')
    expect(screen.getByText(/Elo 1000 → 1000/)).toBeInTheDocument()
    const item = await firstItem()
    expect(within(item).getByText('모름 · 0.00')).toBeInTheDocument()
    expect(within(item).getByText('아직 배운 노트에서 답을 찾지 못했어요.')).toBeInTheDocument()
    expect(within(item).getByText(/정답 보기 전까지 숨겨져 있어요/)).toBeInTheDocument()
    expect(screen.queryByText('모범 답')).not.toBeInTheDocument()
    expect(screen.queryByText(/overflow가 발생/)).not.toBeInTheDocument()
  })

  it('원인은 제안만 하고 학생이 직접 골라 저장한다', async () => {
    renderApp('/battles/1/review')
    const item = await firstItem()
    expect(
      within(item).getByText(/원인 제안: 이 문제를 설명한 노트가 없을 수 있어요/),
    ).toBeInTheDocument()
    const save = within(item).getByRole('button', { name: '복기 저장' })
    expect(within(item).getByLabelText('내가 생각하는 원인')).toHaveValue('')
    expect(save).toBeDisabled()
    await userEvent.selectOptions(within(item).getByLabelText('내가 생각하는 원인'), 'NOT_TAUGHT')
    await userEvent.type(within(item).getByLabelText('복기 메모'), 'overflow 예시를 들어 설명하기')
    await userEvent.click(save)
    expect(await screen.findByText('복기를 저장했어요.')).toBeInTheDocument()
    expect(battle().answers[0]!.review).toMatchObject({
      userCause: 'NOT_TAUGHT',
      studyMemo: 'overflow 예시를 들어 설명하기',
    })
  })

  it('정답 보기는 확인 창을 거치고, 열면 모범 답·자료 근거가 보이며 연습이 막힌다', async () => {
    renderApp('/battles/1/review')
    await firstItem()
    await userEvent.click(screen.getByRole('button', { name: '정답 보기' }))
    const dialog = screen.getByRole('dialog', { name: '정답 보기' })
    expect(dialog).toHaveTextContent('되돌릴 수 없어요')
    await userEvent.click(within(dialog).getByRole('button', { name: '정답 보기' }))
    expect(
      await screen.findAllByText('용량을 초과하여 push하면 overflow가 발생할 수 있습니다.'),
    ).not.toHaveLength(0)
    expect(screen.getAllByText('스택과 큐 · 시연 공개 예문')).not.toHaveLength(0)
    expect(screen.getByRole('button', { name: '정답 공개 · 이 배틀의 연습 종료' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '선택한 문제 연습' })).toBeDisabled()
  })

  it('틀린 문제가 기본 선택돼 있고, 고른 문제로 연습을 시작한다', async () => {
    const router = renderApp('/battles/1/review')
    await firstItem()
    const boxes = screen.getAllByRole('checkbox', { name: /번 문제를 연습에 넣기/ })
    expect(boxes).toHaveLength(5)
    boxes.forEach((box) => expect(box).toBeChecked())
    await userEvent.click(boxes[4]!)
    await userEvent.click(screen.getByRole('button', { name: '선택한 문제 연습' }))
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/battles\/3/))
    expect(mockBattles[2]).toMatchObject({ mode: 'PRACTICE', questionCount: 4, sourceBattleId: 1 })
  })

  it('문제·채점 신고를 보내고, 같은 신고는 다시 못 한다', async () => {
    renderApp('/battles/1/review')
    const item = await firstItem()
    const send = async () => {
      await userEvent.click(within(item).getByRole('button', { name: '문제·채점 신고' }))
      const dialog = screen.getByRole('dialog', { name: '문제·채점 신고' })
      await userEvent.type(within(dialog).getByLabelText('신고 내용'), '정답이 자료와 달라요')
      await userEvent.click(within(dialog).getByRole('button', { name: '확인' }))
      return dialog
    }
    await send()
    expect(await screen.findByText(/신고를 접수했어요/)).toBeInTheDocument()
    const again = await send()
    expect(await within(again).findByRole('alert')).toHaveTextContent('이미 신고한 내용이에요')
  })

  it('연습 배틀 주소로 복기를 열면 연습 결과로 보낸다', async () => {
    const router = renderApp('/battles/1/result')
    await waitFor(() => expect(router.state.location.pathname).toBe('/battles/1/review'))
  })
})

describe('노트 교환 리뷰', () => {
  it('두 사람이 모두 동의했으면 상대 노트를 보여 주고 리뷰를 한 번 보낼 수 있다', async () => {
    renderApp('/battles/1/review')
    const section = (await screen.findByRole('heading', { name: '서로의 노트 교환 리뷰' })).closest(
      'section',
    )!
    expect(await within(section).findByText('지우의 배틀 노트')).toBeInTheDocument()
    expect(within(section).getByRole('checkbox', { name: /노트 공개에 동의/ })).toBeChecked()
    await userEvent.type(within(section).getByLabelText('좋았던 점'), '예시가 구체적이에요')
    await userEvent.type(within(section).getByLabelText('보완할 점'), '큐 설명이 더 필요해요')
    await userEvent.selectOptions(within(section).getByLabelText('근거가 된 노트 (선택)'), '9003')
    await userEvent.click(within(section).getByRole('button', { name: '리뷰 보내기' }))
    expect(await within(section).findByText('내가 남긴 리뷰')).toBeInTheDocument()
    expect(
      within(section).getByText(/근거 노트: “pop은 스택의 맨 위 데이터를 꺼냅니다.”/),
    ).toBeInTheDocument()
    expect(within(section).queryByRole('button', { name: '리뷰 보내기' })).not.toBeInTheDocument()
  })

  it('상대가 동의하지 않았으면 노트를 보여 주지 않는다', async () => {
    useScenario.setState({ opponentNotesPublic: false })
    renderApp('/battles/1/review')
    expect(
      await screen.findByText(/공개되지 않은 노트예요|양쪽 모두 동의한 뒤에만/),
    ).toBeInTheDocument()
    expect(screen.queryByText('지우의 배틀 노트')).not.toBeInTheDocument()
  })

  it('내 동의를 끄면 서버에 알리고 상대 노트가 사라진다', async () => {
    renderApp('/battles/1/review')
    await screen.findByText('지우의 배틀 노트')
    await userEvent.click(screen.getByRole('checkbox', { name: /노트 공개에 동의/ }))
    await waitFor(() => expect(screen.queryByText('지우의 배틀 노트')).not.toBeInTheDocument())
    expect(battle().myNotesPublic).toBe(false)
  })
})

describe('연습 결과', () => {
  async function finishedPractice() {
    const source = battle()
    // 연습 배틀을 만들고 풀이가 끝난 상태로 둔다.
    const response = await fetch('/api/battles/practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceBattleId: source.id, battleAnswerIds: [101, 102] }),
    })
    const { id } = (await response.json()) as { id: number }
    const practice = mockBattles.find((b) => b.id === id)!
    practice.polls = 99
    await fetch(`/api/battles/${id}`)
    return id
  }

  it('이전 결과와 이번 답을 나란히 보여 주고, 다시 연습 버튼은 없다', async () => {
    const id = await finishedPractice()
    renderApp(`/battles/${id}/result`)
    const item = (
      await screen.findByRole('heading', { name: '배열 스택이 가득 찼을 때 생길 수 있는 오류는?' })
    ).closest('article')!
    expect(within(item).getByText('이전 배틀').nextSibling).toHaveTextContent('모름')
    expect(within(item).getByText(/정답 · 1.00/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '원래 배틀 복기로 돌아가기' })).toHaveAttribute(
      'href',
      '/battles/1/review',
    )
    expect(screen.queryByRole('button', { name: /연습/ })).not.toBeInTheDocument()
  })

  it('풀이가 끝난 연습 배틀 방은 연습 결과로 옮긴다', async () => {
    const id = await finishedPractice()
    const router = renderApp(`/battles/${id}`)
    await waitFor(() => expect(router.state.location.pathname).toBe(`/battles/${id}/result`))
  })
})
