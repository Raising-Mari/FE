import { cx } from '@/lib/cx'

interface SpinnerProps {
  /** 주면 스크린리더가 이 문구를 읽는다. 버튼 안처럼 옆에 글이 있으면 생략한다. */
  label?: string
  className?: string
}

export function Spinner({ label, className }: SpinnerProps) {
  return (
    <span role={label ? 'status' : undefined} className={cx('inline-flex', className)}>
      <svg
        className="size-4 animate-spin motion-reduce:animate-none"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}
