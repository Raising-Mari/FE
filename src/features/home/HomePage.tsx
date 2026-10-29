import { useQuery } from '@tanstack/react-query'
import { fetchHealth } from './api'

/** 임시 홈. FE-BE 연결 확인용으로, 실제 홈 화면을 만들 때 교체한다. */
export function HomePage() {
  const { data, error, isPending } = useQuery({ queryKey: ['health'], queryFn: fetchHealth })

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">AI 제자</h1>
      <p className="text-slate-600">내가 가르치면, 제자가 푼다.</p>

      <div className="rounded-lg border border-slate-200 bg-white p-4" aria-live="polite">
        <h2 className="text-sm font-semibold text-slate-500">서버 연결 상태</h2>
        {isPending && <p>확인하는 중…</p>}
        {error && <p className="text-red-600">연결 실패: {error.message}</p>}
        {data && <p className="text-emerald-600">연결됨 ({data.status})</p>}
      </div>
    </section>
  )
}
