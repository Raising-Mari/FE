import { PageHeader } from '@/components/layout/PageHeader'
import { parseId, useUnits } from '@/hooks/useCourseQueries'
import { QuestionBank } from './components/QuestionBank'
import { ReportsPanel } from './components/ReportsPanel'
import { StatsPanel } from './components/StatsPanel'

interface AdminPageProps {
  /** 왼쪽 메뉴에서 고른 과목. 주차로 거르거나 문제를 만들 때 그 과목의 주차를 쓴다. */
  courseId: string | undefined
}

/** 운영·문제 은행·신고(시안 25). 관리자 가드(`RequireAdmin`) 아래에서만 열린다. */
export function AdminPage({ courseId }: AdminPageProps) {
  const units = useUnits(parseId(courseId))

  return (
    <>
      <PageHeader
        banner={false}
        crumbs={['운영·문제 점검']}
        title="문제와 운영 상태를 살펴보세요."
        sub="관리자에게만 보이는 화면이에요. 문항의 정답과 근거가 보이니 화면 공유에 주의해 주세요."
      />
      <div className="flex flex-col gap-6">
        <QuestionBank units={units.data ?? []} />
        <ReportsPanel />
        <StatsPanel />
      </div>
    </>
  )
}
