import mariRound from '@/assets/mari/mari_round.webp'

export function CourseBanner() {
  return (
    <div className="mb-7 flex items-center gap-6 rounded-lg border border-line bg-surface-tint px-7 py-3">
      <svg viewBox="75 30 610 625" role="img" aria-label="마리" className="h-[88px] w-[88px]">
        <image href={mariRound} width="1448" height="1086" />
      </svg>
      <div>
        <p className="text-18 text-navy">마리와 함께, 한 걸음씩.</p>
        <p className="mt-1 text-11 text-muted">설명하고 · 도전하고 · 다시 돌아보기</p>
      </div>
    </div>
  )
}
