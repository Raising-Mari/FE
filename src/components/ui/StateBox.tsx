import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Spinner } from './Spinner'

type Kind = 'loading' | 'error' | 'empty'

interface StateBoxProps {
  /** loading: 불러오는 중 / error: 문제가 생김 / empty: 아직 내용이 없음 */
  kind: Kind
  title?: string
  message?: string
  /** 아래에 놓을 버튼(다시 시도, 첫 행동 등). */
  action?: ReactNode
  className?: string
}

const DEFAULT_TITLES: Record<Exclude<Kind, 'loading'>, string> = {
  error: '문제가 생겼어요',
  empty: '아직 아무것도 없어요',
}

/**
 * 데이터를 기다리거나 실패했거나 비어 있을 때 본문 자리에 대신 놓는 상자. 모든 기능 화면이
 * 로딩·에러·빈 상태를 이 부품으로 만들어 같은 모양을 쓴다(시안 26). 오류는 스크린리더가 바로 읽는다(`role="alert"`).
 */
export function StateBox({ kind, title, message, action, className }: StateBoxProps) {
  const box = cx(
    'flex flex-col items-center gap-3 rounded-lg border border-line bg-surface px-8 py-10 text-center',
    className,
  )

  if (kind === 'loading') {
    return (
      <div role="status" aria-live="polite" className={box}>
        <Spinner className="text-primary [&>svg]:size-6" />
        <p className="text-12 text-subtle">{message ?? '불러오는 중이에요…'}</p>
      </div>
    )
  }

  const isError = kind === 'error'
  return (
    <div role={isError ? 'alert' : undefined} className={box}>
      <span
        aria-hidden="true"
        className={cx(
          'grid size-10 place-items-center rounded-full text-18 leading-none',
          isError ? 'bg-danger-soft text-danger' : 'bg-primary-tint text-primary',
        )}
      >
        {isError ? '!' : '✦'}
      </span>
      <p className="text-14 text-ink">{title ?? DEFAULT_TITLES[kind]}</p>
      {message && (
        <p className="max-w-[360px] text-11 whitespace-pre-line text-subtle">{message}</p>
      )}
      {action}
    </div>
  )
}
