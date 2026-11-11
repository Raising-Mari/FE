import type { HTMLAttributes } from 'react'
import { cx } from '@/lib/cx'

type Tone = 'default' | 'soft' | 'tint'
type Padding = 'none' | 'sm' | 'md'

interface CardProps extends HTMLAttributes<HTMLElement> {
  /** default: 흰 카드 / soft: 안내 상자(회색 바탕) / tint: 강조 배너(옅은 파랑 바탕) */
  tone?: Tone
  padding?: Padding
  as?: 'div' | 'section' | 'article' | 'aside'
}

const tones: Record<Tone, string> = {
  default: 'border-line bg-surface',
  soft: 'border-line-strong bg-canvas',
  tint: 'border-line-strong bg-surface-tint',
}

const paddings: Record<Padding, string> = {
  none: '',
  sm: 'p-[15px]',
  md: 'p-[26px]',
}

export function Card({
  tone = 'default',
  padding = 'md',
  as: Tag = 'div',
  className,
  ...rest
}: CardProps) {
  return (
    <Tag className={cx('rounded-lg border', tones[tone], paddings[padding], className)} {...rest} />
  )
}
