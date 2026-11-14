import { useState } from 'react'
import { useParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { StateBox } from '@/components/ui/StateBox'
import { CourseBanner } from './components/CourseBanner'
import { CreateDiscipleDialog } from './components/CreateDiscipleDialog'
import { CreateUnitDialog } from './components/CreateUnitDialog'
import { useCourse, useDisciple, useMyRatings, useUnits } from './hooks/useCourses'

export function CourseHomePage() {
  const id = Number(useParams().courseId)
  if (!Number.isSafeInteger(id) || id <= 0)
    return <StateBox kind="error" title="과목 주소를 확인해주세요" />
  return <CourseHome courseId={id} key={id} />
}

function CourseHome({ courseId }: { courseId: number }) {
  const course = useCourse(courseId)
  const disciple = useDisciple(courseId)
  const units = useUnits(courseId)
  const ratings = useMyRatings()
  const [dialog, setDialog] = useState<'disciple' | 'unit' | null>(null)
  if (course.isPending) return <StateBox kind="loading" />
  if (course.isError)
    return <ErrorState error={course.error} onRetry={() => void course.refetch()} />
  const rating = ratings.data?.find((item) => item.course?.id === courseId)
  return (
    <>
      <p className="mb-5 text-11 text-subtle">내 과목 / {course.data.name} / 과목 홈</p>
      <h1 className="text-25 tracking-title">
        {disciple.data ? '마리와 오늘도 한 걸음.' : '이 과목에서 함께할 제자를 만나세요.'}
      </h1>
      <p className="mt-2 mb-7 text-12 text-muted">
        {course.data.name} · {course.data.term}
      </p>
      <CourseBanner />
      {disciple.isPending ? (
        <StateBox kind="loading" />
      ) : disciple.isError ? (
        <ErrorState error={disciple.error} onRetry={() => void disciple.refetch()} />
      ) : (
        <Card className="mb-6">
          <h2 className="text-21">
            {disciple.data
              ? `나의 제자 · ${disciple.data.name}`
              : '과목마다 한 명의 제자를 키워요.'}
          </h2>
          {disciple.data ? (
            <>
              <div className="mt-4 flex gap-10 text-12 text-muted">
                <span>
                  내 노트{' '}
                  {units.data
                    ? units.data.reduce((sum, unit) => sum + (unit.myNoteCount ?? 0), 0)
                    : '—'}
                  개
                </span>
                {ratings.isPending ? (
                  <span>Elo 확인 중…</span>
                ) : ratings.isError ? (
                  <span>
                    Elo를 불러오지 못했어요.{' '}
                    <Button variant="link" onClick={() => void ratings.refetch()}>
                      다시 확인
                    </Button>
                  </span>
                ) : (
                  <span>
                    Elo {rating?.rating ?? '—'} · {rating?.gamesPlayed ?? 0}전
                  </span>
                )}
              </div>
              <div className="mt-5 flex gap-3">
                <ButtonLink to={`/courses/${courseId}/teach`}>가르치러 가기 →</ButtonLink>
                <ButtonLink to={`/courses/${courseId}/battle`} variant="secondary">
                  제자 배틀
                </ButtonLink>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 mb-5 text-12 text-muted">
                먼저 제자를 만들어주세요. 설명을 통해 노트를 쌓고, 배틀로 이해를 확인할 수 있어요.
              </p>
              <Button onClick={() => setDialog('disciple')}>나의 제자 만들기</Button>
            </>
          )}
        </Card>
      )}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-18">함께 쓰는 주차</h2>
        <Button variant="secondary" onClick={() => setDialog('unit')}>
          ＋ 주차 만들기
        </Button>
      </div>
      {units.isPending ? (
        <StateBox kind="loading" />
      ) : units.isError ? (
        <ErrorState error={units.error} onRetry={() => void units.refetch()} />
      ) : !units.data.length ? (
        <StateBox
          kind="empty"
          title="아직 주차가 없어요"
          message="배운 내용에 맞춰 주차를 만들어보세요. 자료는 나중에 추가해도 괜찮아요."
        />
      ) : (
        <div className="space-y-3">
          {units.data.map((unit) => (
            <Card key={unit.id} padding="sm" className="flex items-center justify-between">
              <div>
                <h3 className="text-14">{unit.title}</h3>
                <p className="text-11 text-muted">
                  내 노트 {unit.myNoteCount ?? 0}개 ·{' '}
                  {unit.battleReady ? '배틀 가능' : '학습을 더 쌓아주세요'}
                </p>
              </div>
              {disciple.data && unit.id ? (
                <ButtonLink to={`/courses/${courseId}/teach?unitId=${unit.id}`} variant="secondary">
                  가르치기 →
                </ButtonLink>
              ) : (
                <span className="text-11 text-muted">제자를 먼저 만들어주세요</span>
              )}
            </Card>
          ))}
        </div>
      )}
      {dialog === 'disciple' && (
        <CreateDiscipleDialog courseId={courseId} onClose={() => setDialog(null)} />
      )}
      {dialog === 'unit' && (
        <CreateUnitDialog courseId={courseId} onClose={() => setDialog(null)} />
      )}
    </>
  )
}
