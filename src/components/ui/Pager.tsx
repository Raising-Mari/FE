import { Button } from './Button'

interface PagerProps {
  /** 0부터 세는 현재 쪽. */
  page: number
  hasNext: boolean
  onChange: (page: number) => void
  disabled?: boolean
}

/** 목록 아래의 이전·다음. 첫 쪽이고 다음도 없으면 아무것도 그리지 않는다. */
export function Pager({ page, hasNext, onChange, disabled }: PagerProps) {
  if (page === 0 && !hasNext) return null
  return (
    <nav aria-label="쪽 이동" className="flex items-center justify-center gap-3 pt-2">
      <Button
        variant="secondary"
        disabled={disabled || page === 0}
        onClick={() => onChange(page - 1)}
      >
        이전
      </Button>
      <span className="text-11 text-muted" aria-current="page">
        {page + 1}쪽
      </span>
      <Button
        variant="secondary"
        disabled={disabled || !hasNext}
        onClick={() => onChange(page + 1)}
      >
        다음
      </Button>
    </nav>
  )
}
