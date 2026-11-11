import type { ButtonHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'cta' | 'link'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * primary: 화면의 주 행동 / secondary: 보조 행동 / cta: 첫 화면의 큰 시작 버튼 / link: 글자 링크.
   */
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-45'

const variants: Record<Variant, string> = {
  primary: 'min-h-10 rounded-md bg-primary px-5 text-12 text-white enabled:hover:bg-primary-deep',
  secondary:
    'min-h-10 rounded-md border border-line-strong bg-surface px-[18px] text-12 text-ink enabled:hover:bg-surface-soft',
  cta: 'min-h-13 rounded-lg bg-primary px-5 text-14 text-white shadow-cta enabled:hover:bg-primary-deep enabled:active:translate-y-px',
  link: 'min-h-5 px-1.5 text-10 text-primary-soft enabled:hover:underline',
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(base, variants[variant], fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
