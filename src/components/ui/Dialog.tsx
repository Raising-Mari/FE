import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** 아래쪽 버튼 줄(취소·확인 등). 오른쪽 정렬로 놓인다. */
  footer?: ReactNode
  /** false 면 Esc·바깥 클릭·닫기 버튼으로 닫히지 않는다. 끝나기 전에 닫으면 안 되는 작업에만 쓴다. */
  dismissible?: boolean
}

/**
 * 가운데 뜨는 창. 열리면 첫 입력칸(없으면 창 자체)으로 포커스가 가고, Tab 이 창 밖으로 나가지 않으며,
 * 닫히면 열기 전에 눌렀던 요소로 포커스가 돌아온다.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  dismissible = true,
}: DialogProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    const target = panel?.querySelector<HTMLElement>('input, select, textarea') ?? panel
    target?.focus()

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      previouslyFocused?.focus()
    }
  }, [open])

  if (!open) return null

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && dismissible) {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return

    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    const first = items.at(0)
    const last = items.at(-1)
    if (!first || !last) {
      event.preventDefault()
      return
    }
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-overlay px-4 pt-[12vh] pb-8 md:pt-[180px]"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose()
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="h-fit w-full max-w-dialog rounded-xl border border-line-strong bg-surface px-5 pt-6 pb-8 shadow-dialog outline-none md:px-7 md:pt-7 md:pb-[42px]"
      >
        <div className="flex min-h-[43px] items-start justify-between gap-4">
          <h2 id={titleId} className="text-18 text-ink">
            {title}
          </h2>
          {dismissible && (
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              className="-mt-2 -mr-3 grid size-11 shrink-0 place-items-center text-25 leading-none text-subtle hover:text-ink"
            >
              ×
            </button>
          )}
        </div>
        <div className="mt-5">{children}</div>
        {footer && <div className="mt-[25px] flex justify-end gap-2.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
