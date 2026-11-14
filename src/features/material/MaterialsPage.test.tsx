import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { mockMaterials } from '@/mocks/materialHandlers'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/renderApp'

const open = () => renderApp('/courses/1/materials')

describe('학습 자료', () => {
  it('내가 올린 자료와 연결된 주차를 보여 준다', async () => {
    open()
    const item = (
      await screen.findByRole('heading', { name: '스택과 큐 · 시연 공개 예문' })
    ).closest('article')!
    expect(within(item).getByText('처리 완료')).toBeInTheDocument()
    expect(within(item).getByText('1주차 기초')).toBeInTheDocument()
  })

  it('자료가 없으면 빈 상태를 보여 준다', async () => {
    mockMaterials.length = 0
    open()
    expect(await screen.findByText('아직 올린 자료가 없어요')).toBeInTheDocument()
  })

  it('이름·원문·동의가 모두 있어야 저장할 수 있고, 저장하면 목록에 처리 상태가 보인다', async () => {
    open()
    const save = await screen.findByRole('button', { name: '자료 저장' })
    expect(save).toBeDisabled()
    await userEvent.type(screen.getByLabelText('자료 이름'), '트리 강의')
    await userEvent.type(
      screen.getByLabelText('원문 붙여넣기'),
      '트리는 계층 구조를 표현하는 자료구조이며 루트 노드에서 시작해 자식 노드로 가지를 뻗어 나간다.',
    )
    expect(save).toBeDisabled()
    await userEvent.click(screen.getByRole('checkbox', { name: /문제 생성에 사용하는 것에 동의/ }))
    await userEvent.click(save)

    const item = (await screen.findByRole('heading', { name: '트리 강의' })).closest('article')!
    expect(within(item).getByText(/처리 대기|처리 중/)).toBeInTheDocument()
    expect(screen.getByLabelText('자료 이름')).toHaveValue('')
    // 처리 중인 자료가 있으면 목록을 다시 받아 완료까지 따라간다.
    await waitFor(() => expect(within(item).getByText('처리 완료')).toBeInTheDocument(), {
      timeout: 8000,
    })
  }, 12000)

  it('PDF 가 아닌 파일은 올리기 전에 막는다', async () => {
    open()
    const input = await screen.findByLabelText('PDF 파일 (선택)')
    await userEvent.upload(input, new File(['x'], 'note.txt', { type: 'text/plain' }), {
      applyAccept: false,
    })
    expect(screen.getByRole('alert')).toHaveTextContent('PDF 파일만 올릴 수 있어요.')
  })

  it('서버가 거절하면 오류 코드에 맞는 안내를 보여 준다', async () => {
    server.use(
      http.post('/api/courses/:id/materials/text', () =>
        HttpResponse.json({ code: 'RATE_LIMITED' }, { status: 429 }),
      ),
    )
    open()
    await userEvent.type(await screen.findByLabelText('자료 이름'), '트리 강의')
    await userEvent.type(screen.getByLabelText('원문 붙여넣기'), '내용')
    await userEvent.click(screen.getByRole('checkbox', { name: /동의/ }))
    await userEvent.click(screen.getByRole('button', { name: '자료 저장' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('요청이 너무 많아요')
  })

  it('주차 연결을 바꿔 저장한다', async () => {
    open()
    await userEvent.click(await screen.findByRole('button', { name: '주차 연결 관리' }))
    const dialog = screen.getByRole('dialog', { name: '자료와 주차 연결' })
    const unit = within(dialog).getByRole('checkbox', { name: '1주차 기초' })
    expect(unit).toBeChecked()
    await userEvent.click(unit)
    await userEvent.click(within(dialog).getByRole('button', { name: '확인' }))
    expect(await screen.findByText(/아직 연결된 주차가 없어요/)).toBeInTheDocument()
    expect(mockMaterials[0]!.unitIds).toEqual([])
  })

  it('처리에 실패한 자료는 이유를 알려 준다', async () => {
    mockMaterials[0]!.status = 'FAILED'
    mockMaterials[0]!.failReason = 'NO_TEXT'
    open()
    expect(await screen.findByText(/글자를 찾지 못했어요/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '주차 연결 관리' })).toBeDisabled()
  })

  it('삭제가 서버에 아직 없으면 지원하지 않는다고 알려 준다', async () => {
    server.use(
      http.delete('/api/materials/:id', () =>
        HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 }),
      ),
    )
    open()
    await userEvent.click(await screen.findByRole('button', { name: '삭제' }))
    await userEvent.click(
      within(screen.getByRole('dialog', { name: '자료 삭제' })).getByRole('button', {
        name: '삭제',
      }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('heading', { name: '스택과 큐 · 시연 공개 예문' })).toBeInTheDocument()
  })
})
