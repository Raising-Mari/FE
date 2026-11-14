import { cx } from '@/lib/cx'

export type ToastKind = 'info' | 'error'

interface ToastProps {
  kind: ToastKind
  message: string
  onClose: () => void
}

/** 화면 한쪽에 잠깐 뜨는 알림 한 개(시안 26). 오류는 스크린리더가 바로 읽는다. 떠 있는 위치·시간은 `ToastViewport`가 맡는다. */
export function Toast({ kind, message, onClose }: ToastProps) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className="flex w-[360px] overflow-hidden rounded-md border border-line-strong bg-surface shadow-dialog"
    >
      <span
        aria-hidden="true"
        className={cx('w-1 shrink-0', kind === 'error' ? 'bg-danger' : 'bg-primary')}
      />
      <p className="flex-1 py-3.5 pr-2 pl-3 text-12 text-ink">{message}</p>
      <button
        type="button"
        aria-label="알림 닫기"
        onClick={onClose}
        className="grid w-9 shrink-0 place-items-center text-18 leading-none text-subtle hover:text-ink"
      >
        ×
      </button>
    </div>
  )
}
