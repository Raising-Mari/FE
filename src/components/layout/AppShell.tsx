import type { ReactNode } from 'react'

interface AppShellProps {
  /** 헤더 왼쪽. 보통 `Brand`. */
  brand: ReactNode
  /** 헤더 오른쪽. 프로필 같은 것. */
  headerRight?: ReactNode
  /** `NavItem` 들. 넓은 화면(lg)에서는 왼쪽 사이드바, 좁은 화면에서는 헤더 아래 가로 줄로 나온다. */
  nav: ReactNode
  /** 사이드바 위쪽(과목 선택 등). 넓은 화면에서만 보인다. */
  sidebarTop?: ReactNode
  /** 사이드바 맨 아래 안내 문구. 넓은 화면에서만 보인다. */
  sidebarBottom?: ReactNode
  children: ReactNode
}

/**
 * 로그인 뒤 화면의 틀: 헤더(78px) + 왼쪽 메뉴(218px) + 본문.
 * 판단(어느 메뉴가 활성인지, 무엇을 보여 줄지)은 받은 대로 그리고 여기서 하지 않는다.
 */
export function AppShell({
  brand,
  headerRight,
  nav,
  sidebarTop,
  sidebarBottom,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="flex h-header shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-4 md:px-9">
        {brand}
        {headerRight}
      </header>

      <nav
        aria-label="주 메뉴"
        className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-3 py-1.5 lg:hidden"
      >
        {nav}
      </nav>

      <div className="flex flex-1">
        <aside className="sticky top-header hidden h-[calc(100dvh-var(--spacing-header))] w-sidebar shrink-0 flex-col gap-3 self-start overflow-y-auto border-r border-line bg-surface px-[19px] pt-[30px] lg:flex">
          {sidebarTop}
          <nav aria-label="주 메뉴" className="flex flex-col gap-[3px] pt-[15px]">
            {nav}
          </nav>
          {sidebarBottom && (
            <div className="mt-auto border-t border-line pt-[31px] pb-[22px]">{sidebarBottom}</div>
          )}
        </aside>

        <main className="min-w-0 flex-1 px-4 pt-6 pb-5 md:px-[34px] md:pt-[30px] md:pb-[22px]">
          {children}
        </main>
      </div>
    </div>
  )
}
