import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Dialog } from './Dialog'

function Example({ dismissible = true }: { dismissible?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        열기
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="새 과목 만들기"
        dismissible={dismissible}
      >
        <label>
          과목 이름
          <input />
        </label>
      </Dialog>
    </>
  )
}

describe('Dialog', () => {
  it('닫혀 있으면 아무것도 그리지 않는다', () => {
    render(<Example />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('열리면 제목을 이름으로 가진 dialog 가 나오고 첫 입력칸에 포커스가 간다', async () => {
    render(<Example />)
    await userEvent.click(screen.getByRole('button', { name: '열기' }))
    expect(screen.getByRole('dialog', { name: '새 과목 만들기' })).toBeInTheDocument()
    expect(screen.getByLabelText('과목 이름')).toHaveFocus()
  })

  it('Esc 로 닫히고 포커스가 열었던 버튼으로 돌아온다', async () => {
    render(<Example />)
    const opener = screen.getByRole('button', { name: '열기' })
    await userEvent.click(opener)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('닫기 버튼으로 닫힌다', async () => {
    render(<Example />)
    await userEvent.click(screen.getByRole('button', { name: '열기' }))
    await userEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Tab 을 계속 눌러도 창 밖으로 포커스가 나가지 않는다', async () => {
    render(<Example />)
    await userEvent.click(screen.getByRole('button', { name: '열기' }))
    const dialog = screen.getByRole('dialog')
    for (let i = 0; i < 5; i++) {
      await userEvent.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
  })

  it('dismissible 이 false 면 Esc 로 닫히지 않고 닫기 버튼도 없다', async () => {
    render(<Example dismissible={false} />)
    await userEvent.click(screen.getByRole('button', { name: '열기' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument()
  })
})
