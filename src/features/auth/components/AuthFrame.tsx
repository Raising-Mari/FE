import type { ReactNode } from 'react'
import { Link } from 'react-router'
import mariRound from '@/assets/mari/mari_round.webp'

export function AuthFrame({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="px-10 pb-12">
      <Link to="/" className="text-12 text-muted">
        ← 첫 화면으로
      </Link>
      <div className="mx-auto grid max-w-[1000px] grid-cols-2 items-center gap-20 py-12">
        <div className="text-center">
          <svg
            viewBox="75 30 610 625"
            role="img"
            aria-label="꽃을 들고 반기는 마리"
            className="mx-auto h-[300px] w-[300px]"
          >
            <image href={mariRound} width="1448" height="1086" />
          </svg>
          <h2 className="mt-6 text-25 leading-[1.7] tracking-title text-navy">
            다시 만날 때마다,
            <br />
            조금 더 자라 있을 거예요.
          </h2>
          <p className="mt-3 text-12 text-muted">오늘의 설명이 내일의 배움이 되도록.</p>
        </div>
        <section className="py-6">
          <p className="text-10 tracking-eyebrow text-subtle">MY LITTLE STUDY PARTNER</p>
          <h1 className="mt-4 text-25 tracking-title">{title}</h1>
          <p className="mt-3 mb-8 text-12 text-muted">{description}</p>
          {children}
        </section>
      </div>
    </div>
  )
}
