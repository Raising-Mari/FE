import type { InputHTMLAttributes } from 'react'
import { Field, controlClass } from './Field'

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

/** `className` 은 입력창이 아니라 라벨까지 감싼 바깥 틀에 붙는다. */
export function TextInput({ label, hint, error, className, ...rest }: TextInputProps) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(control) => <input type="text" className={controlClass} {...rest} {...control} />}
    </Field>
  )
}
