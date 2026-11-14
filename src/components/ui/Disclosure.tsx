import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

interface DisclosureProps {
  summary: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

/** 눌러서 펼치는 상자. 브라우저 기본 `details` 를 써서 키보드·스크린리더 동작을 그대로 얻는다. */
export function Disclosure({ summary, children, defaultOpen = false, className }: DisclosureProps) {
  return (
    <details
      open={defaultOpen}
      className={cx('group rounded-md border border-line-soft bg-surface p-3', className)}
    >
      <summary className="flex min-h-5 cursor-pointer list-none items-center gap-1 text-11 text-muted [&::-webkit-details-marker]:hidden">
        <svg
          className="size-3 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m4.5 2.5 3.5 3.5-3.5 3.5" />
        </svg>
        {summary}
      </summary>
      <div className="pt-3 text-11 text-ink">{children}</div>
    </details>
  )
}
