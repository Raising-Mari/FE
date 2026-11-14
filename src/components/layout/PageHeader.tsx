import type { ReactNode } from 'react'
import { CourseBanner } from './CourseBanner'

interface PageHeaderProps {
  /** 경로 표시. 예: ['내 과목', '자료구조', '학습 자료'] */
  crumbs: (string | undefined)[]
  title: string
  sub?: ReactNode
  /** 마리 배너를 제목 아래에 둘지. 시안의 과목 화면은 모두 둔다. */
  banner?: boolean
}

/** 로그인 뒤 화면 본문 맨 위의 경로·제목·보조 설명·마리 배너. 화면마다 같은 간격을 쓰도록 한 곳에 둔다. */
export function PageHeader({ crumbs, title, sub, banner = true }: PageHeaderProps) {
  return (
    <>
      <p className="mb-5 text-11 text-subtle">{crumbs.filter(Boolean).join(' / ')}</p>
      <h1 className="text-25 tracking-title text-ink">{title}</h1>
      {sub ? <p className="mt-2 mb-7 text-12 text-muted">{sub}</p> : <div className="mb-7" />}
      {banner && <CourseBanner />}
    </>
  )
}
