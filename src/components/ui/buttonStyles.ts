export type ButtonVariant = 'primary' | 'secondary' | 'cta' | 'link'

/** `Button`(누르면 동작)과 `ButtonLink`(누르면 주소 이동)가 같은 모양을 쓰도록 클래스를 한 곳에 둔다. */
export const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-45'

export const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'min-h-10 rounded-md bg-primary px-5 text-12 text-white enabled:hover:bg-primary-deep',
  secondary:
    'min-h-10 rounded-md border border-line-strong bg-surface px-[18px] text-12 text-ink enabled:hover:bg-surface-soft',
  cta: 'min-h-13 rounded-lg bg-primary px-5 text-14 text-white shadow-cta enabled:hover:bg-primary-deep enabled:active:translate-y-px',
  link: 'min-h-5 px-1.5 text-10 text-primary-soft enabled:hover:underline',
}
