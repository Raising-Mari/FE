import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { cx } from '@/lib/cx'

interface NavItemProps {
  to: string
  /** 글자 앞 아이콘 자리. 장식이라 스크린리더는 읽지 않는다. */
  icon?: ReactNode
  /** true 면 하위 주소(`/a/b`)에서는 활성 표시를 하지 않는다. */
  end?: boolean
  children: ReactNode
}

/** 사이드바·모바일 메뉴 줄의 한 항목. 현재 주소와 맞으면 `aria-current="page"` 와 파란 바탕이 붙는다. */
export function NavItem({ to, icon, end, children }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          'flex min-h-11 shrink-0 items-center gap-2 rounded-md px-[15px] text-12 leading-tight whitespace-nowrap lg:min-h-[41px]',
          isActive ? 'bg-primary-tint text-primary' : 'text-muted hover:bg-surface-soft',
        )
      }
    >
      {icon && (
        <span aria-hidden="true" className="w-4 text-center">
          {icon}
        </span>
      )}
      {children}
    </NavLink>
  )
}
