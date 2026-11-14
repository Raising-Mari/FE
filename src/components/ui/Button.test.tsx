import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { Button } from './Button'
import { ButtonLink } from './ButtonLink'

describe('Button', () => {
  it('form 안에서도 실수로 제출하지 않도록 기본 type 이 button 이다', () => {
    render(<Button>저장</Button>)
    expect(screen.getByRole('button', { name: '저장' })).toHaveAttribute('type', 'button')
  })

  it('누르면 onClick 을 부른다', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>저장</Button>)
    await userEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('loading 이면 비활성이 되고 눌려도 반응하지 않는다', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        저장
      </Button>,
    )
    const button = screen.getByRole('button', { name: '저장' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('disabled 면 눌려도 반응하지 않는다', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        저장
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('ButtonLink', () => {
  it('버튼 모양이지만 링크로 읽히고 주소를 가진다', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/courses/new" variant="secondary">
          과목 만들기
        </ButtonLink>
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: '과목 만들기' })
    expect(link).toHaveAttribute('href', '/courses/new')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
