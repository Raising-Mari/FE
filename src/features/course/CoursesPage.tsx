import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { StateBox } from '@/components/ui/StateBox'
import type { MyCourse } from './api'
import { CourseBanner } from './components/CourseBanner'
import { CreateCourseDialog } from './components/CreateCourseDialog'
import { useMyCourses, useUnits } from './hooks/useCourses'

function CourseCard({ course }: { course: MyCourse & { id: number } }) {
  const units = useUnits(course.id)
  return (
    <Card>
      <p className="text-10 tracking-eyebrow text-subtle">CLASSROOM</p>
      <h2 className="mt-3 text-21">{course.name}</h2>
      <p className="mt-2 text-12 text-muted">
        {course.term} ·{' '}
        {course.disciple ? `나의 제자 ${course.disciple.name ?? ''}` : '제자를 만들어주세요'}
      </p>
      {units.isError ? (
        <div className="mt-2">
          <p className="text-11 text-danger">주차 수를 불러오지 못했어요.</p>
          <Button variant="link" onClick={() => void units.refetch()}>
            다시 확인
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-11 text-muted">
          {units.isPending ? '주차 수 확인 중…' : `${units.data.length}개 주차`}
        </p>
      )}
      <ButtonLink to={`/courses/${course.id}`} className="mt-5">
        과목 열기 →
      </ButtonLink>
    </Card>
  )
}

export function CoursesPage() {
  const courses = useMyCourses()
  const [creating, setCreating] = useState(false)
  return (
    <>
      <p className="mb-5 text-11 text-subtle">내 과목</p>
      <h1 className="text-25 tracking-title">나의 배움, 나의 제자.</h1>
      <p className="mt-2 mb-7 text-12 text-muted">과목을 선택하거나 새로 만들어주세요.</p>
      <CourseBanner />
      <div className="mb-5 flex justify-end">
        <Button onClick={() => setCreating(true)}>＋ 새 과목 만들기</Button>
      </div>
      {courses.isPending ? (
        <StateBox kind="loading" />
      ) : courses.isError ? (
        <ErrorState error={courses.error} onRetry={() => void courses.refetch()} />
      ) : !courses.data.length ? (
        <StateBox
          kind="empty"
          title="아직 참여한 과목이 없어요"
          message="기존 과목을 찾거나 새 과목을 만들어 마리와 시작해보세요."
          action={<Button onClick={() => setCreating(true)}>과목 찾아보기</Button>}
        />
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {courses.data
            .filter((course): course is MyCourse & { id: number } => typeof course.id === 'number')
            .map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
        </div>
      )}
      {creating && <CreateCourseDialog onClose={() => setCreating(false)} />}
    </>
  )
}
