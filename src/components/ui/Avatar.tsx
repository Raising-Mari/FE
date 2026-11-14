import { cx } from '@/lib/cx'

interface AvatarProps {
  name: string
  className?: string
}

/** 이름의 첫 글자를 동그라미에 보여 준다. 사진은 쓰지 않는다. */
export function Avatar({ name, className }: AvatarProps) {
  const initial = Array.from(name.trim())[0] ?? ''
  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        'grid size-[34px] shrink-0 place-items-center rounded-full bg-primary-tint text-12 leading-none text-ink',
        className,
      )}
    >
      {initial}
    </span>
  )
}
