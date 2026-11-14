import type { ReactNode } from 'react'

interface PublicShellProps {
  brand: ReactNode
  /** 헤더 오른쪽 (언어 표시 등). */
  headerRight?: ReactNode
  /** 본문 아래 줄. */
  footer?: ReactNode
  children: ReactNode
}

/** 로그인 전 화면(첫 화면·로그인·가입)의 틀: 가운데 정렬된 1200px 폭에 헤더(100px)와 본문. */
export function PublicShell({ brand, headerRight, footer, children }: PublicShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <div className="mx-auto flex w-full max-w-public flex-1 flex-col">
        <header className="flex h-public-header shrink-0 items-center justify-between gap-4 px-10">
          {brand}
          {headerRight}
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        {footer}
      </div>
    </div>
  )
}
