import type { TextareaHTMLAttributes } from 'react'
import { Field } from './Field'

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

/** 긴 글을 쓰는 칸. 입력창(`TextInput`)과 달리 바탕이 흰색이고 테두리가 한 단계 진하다(시안 그대로). */
export function Textarea({ label, hint, error, className, ...rest }: TextareaProps) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(control) => (
        <textarea
          className="min-h-16 w-full resize-y rounded-md border border-line-strong bg-surface p-3 text-11 leading-[1.8] text-ink placeholder:text-placeholder disabled:cursor-not-allowed disabled:opacity-45 aria-[invalid=true]:border-danger"
          {...rest}
          {...control}
        />
      )}
    </Field>
  )
}
