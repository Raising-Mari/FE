import type { InputHTMLAttributes, ReactNode } from 'react'
import { cx } from '@/lib/cx'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  className?: string
}

/** 라벨 전체가 눌리는 영역이다. 체크 표시만 직접 그리고 나머지는 브라우저 기본 체크박스 그대로 동작한다. */
export function Checkbox({ label, className, disabled, ...rest }: CheckboxProps) {
  return (
    <label
      className={cx(
        'flex min-h-11 items-start gap-3 py-2 text-12 text-ink md:min-h-0 md:py-0',
        disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer',
        className,
      )}
    >
      <span className="relative mt-[3px] size-4 shrink-0">
        <input
          type="checkbox"
          disabled={disabled}
          className="peer absolute inset-0 size-4 cursor-[inherit] appearance-none rounded-xs border border-placeholder bg-surface checked:border-primary checked:bg-primary"
          {...rest}
        />
        <svg
          className="pointer-events-none absolute inset-0 hidden size-4 text-white peer-checked:block"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m4.5 8.5 2.2 2.2L11.5 5.8" />
        </svg>
      </span>
      <span className="leading-[1.7]">{label}</span>
    </label>
  )
}
