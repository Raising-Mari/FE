import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { mockNotes } from '@/mocks/teachingHandlers'
import { renderApp } from '@/test/renderApp'

const open = (path = '/courses/1/teach') => renderApp(path)
const input = () => screen.findByLabelText('설명 입력')
const notes = () => screen.getByRole('region', { name: '배운 노트' })

describe('가르치기', () => {
  it('주차 목록·대화·읽기 전용 노트를 보여 준다', async () => {
    open()
    expect(
      await screen.findByText('설명 고마워! 알려준 내용을 노트에 적었어.', { exact: false }),
    ).toBeInTheDocument()
    const panel = notes()
    expect(
      await within(panel).findByText('push는 스택의 맨 위에 데이터를 추가합니다.'),
    ).toBeInTheDocument()
    expect(within(panel).getByText('4 / 60')).toBeInTheDocument()
    // 노트를 직접 고치거나 지우는 버튼은 없다.
    expect(within(panel).queryByRole('button')).not.toBeInTheDocument()
    const chapters = screen.getByRole('navigation', { name: '주차' })
    expect(within(chapters).getByRole('link', { name: /1주차 기초/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(chapters).getByText('4개 노트')).toBeInTheDocument()
  })

  it('설명을 보내면 제자의 답이 이어지고 노트가 늘어난다', async () => {
    open()
    await userEvent.type(await input(), 'pop은 스택의 맨 위 데이터를 꺼냅니다.{Enter}')
    expect(await screen.findAllByText('설명 고마워! 알려준 내용을 노트에 적었어.')).toHaveLength(1)
    expect(
      await within(notes()).findByText('pop은 스택의 맨 위 데이터를 꺼냅니다.'),
    ).toBeInTheDocument()
    expect(within(notes()).getByText('5 / 60')).toBeInTheDocument()
    expect(await input()).toHaveValue('')
  })

  it('Shift+Enter 는 줄을 바꾸고 보내지 않는다', async () => {
    open()
    const box = await input()
    await userEvent.type(box, '첫 줄{Shift>}{Enter}{/Shift}둘째 줄')
    expect(box).toHaveValue('첫 줄\n둘째 줄')
    expect(mockNotes).toHaveLength(4)
  })

  it('AI 오류면 같은 메시지를 다시 보낼 수 있다', async () => {
    const ids: string[] = []
    server.use(
      http.post(
        '/api/disciples/:id/messages',
        async ({ request }) => {
          ids.push(((await request.json()) as { clientMessageId: string }).clientMessageId)
          return HttpResponse.json({ code: 'AI_UNAVAILABLE' }, { status: 503 })
        },
        { once: true },
      ),
    )
    open()
    await userEvent.type(await input(), 'peek는 맨 위의 값을 확인만 합니다.{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('AI에 연결하지 못했어요')
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST')
        void request
          .clone()
          .json()
          .then((body: { clientMessageId: string }) => ids.push(body.clientMessageId))
    })
    await userEvent.click(screen.getByRole('button', { name: '다시 보내기' }))
    expect(
      await within(notes()).findByText('peek는 맨 위의 값을 확인만 합니다.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    // 두 번 저장되지 않게 같은 id 로 다시 보낸다.
    expect(ids).toHaveLength(2)
    expect(ids[0]).toBe(ids[1])
    server.events.removeAllListeners()
  })

  it('비슷한 노트가 있으면 제자 답 아래 확인 카드로 합치기를 묻는다', async () => {
    open()
    await userEvent.type(await input(), 'push는 스택의 맨 위에 값을 올립니다.{Enter}')
    const card = await screen.findByRole('region', { name: '비슷한 노트 합치기' })
    expect(card).toHaveTextContent('push는 스택의 맨 위에 데이터를 추가합니다.')
    await userEvent.click(within(card).getByRole('button', { name: '합치기' }))
    await waitFor(() => expect(card).not.toBeInTheDocument())
    await waitFor(() =>
      expect(
        within(notes()).queryByText('push는 스택의 맨 위에 데이터를 추가합니다.'),
      ).not.toBeInTheDocument(),
    )
    expect(within(notes()).getByText('4 / 60')).toBeInTheDocument()
  })

  it('노트에 담기지 않은 부분이 있으면 보완하도록 안내한다', async () => {
    open()
    await userEvent.type(await input(), '큐{Enter}')
    expect(await screen.findByText(/이 부분은 노트에 담기지 않았어요/)).toBeInTheDocument()
  })

  it('붙여넣으면 내 말로 설명하라고 안내하고 전송은 막지 않는다', async () => {
    open()
    const box = await input()
    await userEvent.click(box)
    await userEvent.paste('deque는 양쪽 끝에서 넣고 뺄 수 있습니다.')
    expect(screen.getByText(/붙여넣은 글이에요/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '보내기 ↑' })).toBeEnabled()
  })

  it('주차가 없으면 주차 만들기를 안내한다', async () => {
    server.use(http.get('/api/courses/:id/units', () => HttpResponse.json([])))
    open()
    expect(await screen.findByText('아직 주차가 없어요')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '＋ 주차 만들기' }))
    expect(screen.getByRole('dialog', { name: '주차 만들기' })).toBeInTheDocument()
  })
})
