import type { HTMLAttributes } from 'react'
import { cx } from '@/lib/cx'

/** 작은 상태·구분 표시(알약). 누를 수 있는 요소가 아니다. */
export function Pill({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cx(
        'inline-flex h-7 items-center gap-1 rounded-full border border-line-strong bg-surface-muted px-[11px] text-10 leading-tight whitespace-nowrap text-navy',
        className,
      )}
      {...rest}
    />
  )
}
