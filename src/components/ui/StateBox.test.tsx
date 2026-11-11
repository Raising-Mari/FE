import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError, NETWORK_ERROR_CODE } from '@/api/errors'
import { Button } from './Button'
import { ErrorState } from './ErrorState'
import { StateBox } from './StateBox'

describe('StateBox', () => {
  it('로딩은 상태 영역으로 읽히고 기본 문구가 있다', () => {
    render(<StateBox kind="loading" />)
    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중이에요…')
  })

  it('오류는 alert 로 읽히고 제목·설명·버튼을 보여 준다', () => {
    render(
      <StateBox
        kind="error"
        message="서버에서 답을 받지 못했어요."
        action={<Button>다시 시도</Button>}
      />,
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('문제가 생겼어요')
    expect(alert).toHaveTextContent('서버에서 답을 받지 못했어요.')
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })

  it('빈 상태는 기본 제목과 첫 행동 버튼을 보여 준다', () => {
    render(
      <StateBox
        kind="empty"
        message="첫 번째로 만들어 보세요."
        action={<Button>만들어 보기</Button>}
      />,
    )
    expect(screen.getByText('아직 아무것도 없어요')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '만들어 보기' })).toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('오류 코드에 맞는 안내문을 보여 준다', () => {
    render(<ErrorState error={new ApiError(409, { code: 'BATTLE_NOTES_REQUIRED' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('이 주차에 내 노트가 없어요')
  })

  it('서버에 닿지 못하면 제목을 따로 쓴다', () => {
    render(<ErrorState error={new ApiError(0, { code: NETWORK_ERROR_CODE })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('서버에 연결할 수 없어요')
  })

  it('다시 시도를 누르면 onRetry 를 부른다', async () => {
    const onRetry = vi.fn()
    render(<ErrorState error={new Error('x')} onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('onRetry 가 없으면 버튼을 보여 주지 않는다', () => {
    render(<ErrorState error={new Error('x')} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
