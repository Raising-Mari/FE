import type { SelectHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import { Field, controlClass } from './Field'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

/** 브라우저 기본 선택 상자(키보드 조작이 그대로 동작)에 화살표만 시안대로 그린다. */
export function Select({ label, hint, error, className, children, ...rest }: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(control) => (
        <div className="relative">
          <select
            className={cx(controlClass, 'appearance-none pr-8 pl-[17px]')}
            {...rest}
            {...control}
          >
            {children}
          </select>
          <svg
            className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-subtle"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2.5 4.5 6 8l3.5-3.5" />
          </svg>
        </div>
      )}
    </Field>
  )
}
