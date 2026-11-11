import { render, screen } from '@testing-library/react'
import { TextInput } from './TextInput'

describe('TextInput', () => {
  it('라벨을 눌러도 입력칸을 찾을 수 있도록 라벨과 이어져 있다', () => {
    render(<TextInput label="닉네임" />)
    expect(screen.getByLabelText('닉네임')).toBeInTheDocument()
  })

  it('도움말은 입력칸의 설명으로 이어진다', () => {
    render(<TextInput label="닉네임" hint="2~10자" />)
    expect(screen.getByLabelText('닉네임')).toHaveAccessibleDescription('2~10자')
  })

  it('오류가 있으면 오류 상태로 표시하고 오류 문구를 설명에 넣는다', () => {
    render(<TextInput label="닉네임" hint="2~10자" error="2자 이상 입력해 주세요." />)
    const input = screen.getByLabelText('닉네임')
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription('2~10자 2자 이상 입력해 주세요.')
    expect(screen.getByRole('alert')).toHaveTextContent('2자 이상 입력해 주세요.')
  })

  it('오류가 없으면 오류 상태가 아니다', () => {
    render(<TextInput label="닉네임" />)
    expect(screen.getByLabelText('닉네임')).toBeValid()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
