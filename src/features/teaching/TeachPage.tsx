import { useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { StateBox } from '@/components/ui/StateBox'
import { parseId, useCourse, useDisciple, useUnits } from '@/hooks/useCourseQueries'
import { cx } from '@/lib/cx'
import { ChatPanel } from './components/ChatPanel'
import { NotePanel } from './components/NotePanel'

interface TeachPageProps {
  /** 내 닉네임(말풍선 이름). 라우터가 내 정보에서 넘긴다. */
  myName: string
  /** "＋ 주차 만들기" 창. 과목 기능의 것을 라우터가 끼워 준다(기능끼리 직접 import 하지 않는다). */
  renderCreateUnit: (props: { courseId: number; onClose: () => void }) => ReactNode
}

/** 가르치기와 주차별 노트(시안 09): 주차 목록 + 채팅 + 읽기 전용 노트. 고른 주차는 주소의 `?unitId=` 에 둔다. */
export function TeachPage({ myName, renderCreateUnit }: TeachPageProps) {
  const courseId = parseId(useParams().courseId)
  const [params] = useSearchParams()
  const course = useCourse(courseId)
  const disciple = useDisciple(courseId)
  const units = useUnits(courseId)
  const [creating, setCreating] = useState(false)

  const requested = parseId(params.get('unitId') ?? undefined)
  const unit = units.data?.find((u) => u.id === requested) ?? units.data?.[0]
  const discipleId = disciple.data?.id ?? 0

  return (
    <>
      <PageHeader
        banner={false}
        crumbs={['내 과목', course.data?.name, '가르치기']}
        title="설명하면서, 더 확실하게."
        sub={unit?.title}
      />
      {units.isPending || disciple.isPending ? (
        <StateBox kind="loading" />
      ) : units.isError ? (
        <ErrorState error={units.error} onRetry={() => void units.refetch()} />
      ) : disciple.isError ? (
        <ErrorState error={disciple.error} onRetry={() => void disciple.refetch()} />
      ) : !unit?.id ? (
        <StateBox
          kind="empty"
          title="아직 주차가 없어요"
          message="가르칠 주차를 먼저 만들어 주세요."
          action={<Button onClick={() => setCreating(true)}>＋ 주차 만들기</Button>}
        />
      ) : (
        <div className="grid grid-cols-[200px_minmax(0,1fr)_300px] items-start gap-5">
          <nav aria-label="주차" className="flex flex-col gap-1.5">
            <p className="px-1 pb-1 text-10 tracking-eyebrow text-subtle">CHAPTERS</p>
            {units.data.map((item) => (
              <Link
                key={item.id}
                to={`?unitId=${item.id}`}
                aria-current={item.id === unit.id ? 'page' : undefined}
                className={cx(
                  'rounded-md border px-3 py-2.5',
                  item.id === unit.id
                    ? 'border-primary-soft bg-primary-tint'
                    : 'border-line bg-surface hover:bg-surface-soft',
                )}
              >
                <span className="block text-12 break-words text-ink">{item.title}</span>
                <span className="block text-10 text-subtle">{item.myNoteCount ?? 0}개 노트</span>
              </Link>
            ))}
            <Button variant="secondary" className="mt-1" onClick={() => setCreating(true)}>
              ＋ 주차 만들기
            </Button>
          </nav>
          {/* 주차를 바꾸면 입력 중인 글·재전송 상태를 버리도록 key 로 새로 만든다. */}
          <ChatPanel
            key={unit.id}
            courseId={courseId}
            discipleId={discipleId}
            discipleName={disciple.data?.name ?? '마리'}
            myName={myName}
            unitId={unit.id}
            unitTitle={unit.title ?? ''}
          />
          <NotePanel courseId={courseId} discipleId={discipleId} unitId={unit.id} />
        </div>
      )}
      {creating && renderCreateUnit({ courseId, onClose: () => setCreating(false) })}
    </>
  )
}
