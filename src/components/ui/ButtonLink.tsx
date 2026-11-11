import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from '@/lib/cx'
import { buttonBase, buttonVariants, type ButtonVariant } from './buttonStyles'

interface ButtonLinkProps extends Omit<LinkProps, 'className'> {
  variant?: ButtonVariant
  fullWidth?: boolean
  className?: string
  children: ReactNode
}

/**
 * 버튼 모양이지만 누르면 다른 주소로 가는 링크. 동작(저장·전송)은 `Button`, 화면 이동은 이것을 쓴다.
 * 이동하는 것을 `<button>` 으로 만들면 새 탭으로 열기·주소 복사가 안 되고 스크린리더가 버튼으로 읽는다.
 */
export function ButtonLink({
  variant = 'primary',
  fullWidth = false,
  className,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={cx(buttonBase, buttonVariants[variant], fullWidth && 'w-full', className)}
      {...rest}
    />
  )
}
