import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockQuestions, mockReports } from '@/mocks/adminHandlers'
import { useScenario } from '@/mocks/scenario'
import { renderApp } from '@/test/renderApp'

const section = async (name: string | RegExp) =>
  (await screen.findByRole('heading', { name })).closest('section')!

beforeEach(() => useScenario.setState({ role: 'ADMIN' }))

describe('운영·문제 점검', () => {
  it('학생은 들어올 수 없다', async () => {
    useScenario.setState({ role: 'STUDENT' })
    renderApp('/admin')
    expect(await screen.findByText('관리자만 볼 수 있는 화면이에요')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '문제 은행' })).not.toBeInTheDocument()
  })

  it('문항 목록을 상태로 거르고 상세에서 상태를 바꾼다', async () => {
    renderApp('/admin')
    const bank = await section('문제 은행')
    const list = await within(bank).findByRole('list', { name: '문항' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(5)
    expect(list).toHaveTextContent('정답률 0% (1회)')
    expect(list).toHaveTextContent('아직 사용 전')

    await userEvent.click(
      within(list).getByRole('button', {
        name: '스택에 데이터를 추가하는 연산은 무엇인가요? 상세',
      }),
    )
    const dialog = await screen.findByRole('dialog', { name: '문항 상세' })
    expect(await within(dialog).findByText('미판정')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: '검수 통과(으)로 바꾸기' }))
    await waitFor(() => expect(mockQuestions.find((q) => q.id === 3)?.status).toBe('VERIFIED'))

    await userEvent.keyboard('{Escape}')
    await userEvent.selectOptions(within(bank).getByLabelText('상태'), 'VERIFIED')
    await waitFor(() =>
      expect(within(bank).getByRole('list', { name: '문항' }).children).toHaveLength(1),
    )
  })

  it('문제를 직접 추가한다', async () => {
    renderApp('/courses/1')
    await screen.findByRole('heading', { name: /나의 제자/ })
    await userEvent.click(screen.getByRole('link', { name: /운영·문제 점검/ }))
    const bank = await section('문제 은행')
    await userEvent.click(within(bank).getByRole('button', { name: '문제 직접 추가' }))
    const dialog = screen.getByRole('dialog', { name: '문제 직접 추가' })
    await userEvent.type(within(dialog).getByLabelText('문제'), '큐의 앞을 가리키는 것은?')
    await userEvent.type(within(dialog).getByLabelText('정답 (한 줄에 하나)'), 'front')
    await userEvent.type(within(dialog).getByLabelText('모범 답'), 'front는 큐의 앞을 가리킵니다.')
    await userEvent.type(within(dialog).getByLabelText('근거 문장'), '강의자료 3장')
    await userEvent.click(within(dialog).getByRole('button', { name: '문제 추가' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(mockQuestions.at(-1)).toMatchObject({
      stem: '큐의 앞을 가리키는 것은?',
      answers: ['front'],
      source: 'MANUAL',
      unitId: 1,
    })
  })

  it('신고를 처리하면서 문항을 사용 중지한다', async () => {
    renderApp('/admin')
    const reports = await section('신고·이의제기')
    const list = await within(reports).findByRole('list', { name: '신고' })
    expect(list).toHaveTextContent('문제 신고 · 문제가 모호함')
    await userEvent.click(within(list).getByRole('button', { name: '처리' }))
    const dialog = screen.getByRole('dialog', { name: '신고 처리' })
    await userEvent.selectOptions(within(dialog).getByLabelText('문항 조치'), 'RETIRE')
    await userEvent.type(within(dialog).getByLabelText('처리 메모'), '문항을 고칠 때까지 중지')
    await userEvent.click(within(dialog).getByRole('button', { name: '처리' }))
    // 기본 필터가 "접수"라서 처리한 신고는 목록에서 빠진다.
    expect(await within(reports).findByText('접수된 신고가 없어요.')).toBeInTheDocument()
    expect(mockReports[0]).toMatchObject({
      status: 'ACCEPTED',
      resolutionNote: '문항을 고칠 때까지 중지',
    })
    expect(mockQuestions.find((q) => q.id === 5)?.status).toBe('RETIRED')
  })

  it('사용 통계와 AI 호출 수를 보여 준다', async () => {
    renderApp('/admin')
    const stats = await section(/사용 통계/)
    expect(await within(stats).findByText('활동한 학생')).toBeInTheDocument()
    const table = await within(stats).findByRole('table', { name: '일별 AI 호출 수' })
    expect(
      within(table).getByRole('row', { name: /2026-11-14 14 1 5200 1800/ }),
    ).toBeInTheDocument()
    expect(within(stats).getByText(/너무 어렵거나 쉬운 것이 없어요/)).toBeInTheDocument()
  })
})
