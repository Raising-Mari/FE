import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MAX_TOASTS, toast, useToastStore } from '@/stores/toastStore'
import { TOAST_DURATION_MS, ToastViewport } from './ToastViewport'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ToastViewport', () => {
  it('안내와 오류를 종류에 맞는 역할로 보여 준다', () => {
    render(<ToastViewport />)
    act(() => {
      toast.info('자료를 저장했어요.')
      toast.error('저장하지 못했어요.')
    })
    expect(screen.getByRole('status')).toHaveTextContent('자료를 저장했어요.')
    expect(screen.getByRole('alert')).toHaveTextContent('저장하지 못했어요.')
  })

  it('닫기 버튼으로 지운다', async () => {
    render(<ToastViewport />)
    act(() => toast.info('저장했어요.'))
    await userEvent.click(screen.getByRole('button', { name: '알림 닫기' }))
    expect(screen.queryByText('저장했어요.')).not.toBeInTheDocument()
  })

  it('4초 뒤에 저절로 사라진다', () => {
    vi.useFakeTimers()
    render(<ToastViewport />)
    act(() => toast.info('저장했어요.'))
    expect(screen.getByText('저장했어요.')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS + 10)
    })
    expect(screen.queryByText('저장했어요.')).not.toBeInTheDocument()
  })

  it('한 번에 최대 개수까지만 보이고 오래된 것부터 지운다', () => {
    render(<ToastViewport />)
    act(() => {
      for (let i = 1; i <= MAX_TOASTS + 2; i++) toast.info(`알림 ${i}`)
    })
    expect(screen.queryByText('알림 1')).not.toBeInTheDocument()
    expect(screen.getByText(`알림 ${MAX_TOASTS + 2}`)).toBeInTheDocument()
    expect(screen.getAllByRole('status')).toHaveLength(MAX_TOASTS)
  })
})
