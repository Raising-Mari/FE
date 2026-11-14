import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { SERVICE_NAME } from '@/lib/brand'
import { fetchHealth } from './api'

/** 임시 홈. FE-BE 연결 확인용으로, 실제 홈 화면을 만들 때 교체한다. */
export function HomePage() {
  const { data, error, isPending } = useQuery({ queryKey: ['health'], queryFn: fetchHealth })

  return (
    <section className="space-y-4">
      <h1 className="text-25 tracking-title text-ink">{SERVICE_NAME}</h1>
      <p className="text-12 text-subtle">내가 가르치면, 제자가 푼다.</p>

      <Card aria-live="polite" className="space-y-1">
        <h2 className="text-11 text-muted">서버 연결 상태</h2>
        {isPending && <p>확인하는 중…</p>}
        {error && <p className="text-danger">연결 실패: {error.message}</p>}
        {data && <p className="text-primary">연결됨 ({data.status})</p>}
      </Card>
    </section>
  )
}
