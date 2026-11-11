import { useId, type ReactNode } from 'react'
import { cx } from '@/lib/cx'

/** 입력 요소가 받아야 하는 공통 속성. Field 가 만들어 render prop 으로 넘긴다. */
export interface FieldControlProps {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
}

interface FieldProps {
  label: string
  /** 입력 방법을 알려 주는 짧은 글. */
  hint?: string
  /** 값이 잘못됐을 때의 안내. 주면 입력 요소가 오류 상태가 된다. */
  error?: string
  className?: string
  children: (control: FieldControlProps) => ReactNode
}

/**
 * 라벨 + 입력 요소 + 도움말·오류를 묶는 틀. 라벨은 항상 보이고(placeholder 로 대신하지 않는다),
 * 도움말·오류는 aria-describedby 로 입력 요소에 이어 준다.
 */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cx('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-11 text-muted">
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && (
        <p id={hintId} className="text-10 text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-10 text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * 한 줄 입력 요소(입력창·선택 상자)의 공통 모양. 높이 44px은 시안의 43~47px을 합친 값이고 터치 기준과도 같다.
 * 글자는 터치 화면에서 16px로 둔다. 그보다 작으면 iOS 사파리가 입력할 때 화면을 확대한다.
 */
export const controlClass =
  'min-h-11 w-full rounded-md border border-line bg-surface-soft px-[13px] text-[16px] leading-tight text-ink placeholder:text-placeholder disabled:cursor-not-allowed disabled:opacity-45 aria-[invalid=true]:border-danger md:text-12'
