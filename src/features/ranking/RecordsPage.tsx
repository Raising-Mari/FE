import { useState } from 'react'
import { useParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pager } from '@/components/ui/Pager'
import { Pill } from '@/components/ui/Pill'
import { StateBox } from '@/components/ui/StateBox'
import { parseId, useCourse } from '@/hooks/useCourseQueries'
import { cx } from '@/lib/cx'
import { formatKst, formatScore } from '@/lib/datetime'
import { RESULT_SHORT } from '@/lib/verdict'
import type { BattleMode, BattleSummary } from './api'
import { useBattleRecords } from './hooks/useRanking'

const STATUS_LABEL: Record<NonNullable<BattleSummary['status']>, string> = {
  WAITING: '상대 입장 대기',
  LOBBY: '준비 대기',
  RUNNING: '풀이·채점 중',
  FINISHED: '완료',
  CANCELED: '취소됨',
  EXPIRED: '만료됨',
  ERROR: '오류',
}

const FILTERS: { label: string; mode: BattleMode | null }[] = [
  { label: '전체', mode: null },
  { label: '랭킹 배틀', mode: 'RANKED' },
  { label: '연습', mode: 'PRACTICE' },
]

/** 끝난 랭킹 배틀은 복기로, 끝난 연습은 연습 결과로, 진행 중이면 그 방으로 연다. */
function linkOf(battle: BattleSummary): string | null {
  if (!battle.id) return null
  if (battle.status === 'FINISHED')
    return `/battles/${battle.id}/${battle.mode === 'PRACTICE' ? 'result' : 'review'}`
  if (battle.status === 'CANCELED' || battle.status === 'EXPIRED') return null
  return `/battles/${battle.id}`
}

/** 배틀·연습 기록(시안 22). 서버가 준 점수·결과를 그대로 보여 주고 계산하지 않는다. */
export function RecordsPage() {
  const courseId = parseId(useParams().courseId)
  const course = useCourse(courseId)
  const [mode, setMode] = useState<BattleMode | null>(null)
  const [page, setPage] = useState(0)
  const records = useBattleRecords(courseId, mode, page)

  if (!courseId) return <StateBox kind="error" title="과목 주소를 확인해주세요" />

  return (
    <>
      <PageHeader
        crumbs={['내 과목', course.data?.name, '배틀 기록']}
        title="도전의 기록을 모아봤어요."
        sub="지난 배틀과 연습을 다시 열어 원인과 메모를 확인하세요."
      />
      <div role="group" aria-label="기록 종류" className="mb-4 flex gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            aria-pressed={mode === filter.mode}
            onClick={() => {
              setMode(filter.mode)
              setPage(0)
            }}
            className={cx(
              'min-h-8 rounded-full border px-3.5 text-11',
              mode === filter.mode
                ? 'border-primary bg-primary-tint text-primary'
                : 'border-line-strong bg-surface text-muted hover:bg-surface-soft',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {records.isPending ? (
        <StateBox kind="loading" />
      ) : records.isError ? (
        <ErrorState error={records.error} onRetry={() => void records.refetch()} />
      ) : (records.data.items ?? []).length === 0 ? (
        <StateBox
          kind="empty"
          title="아직 기록이 없어요"
          message="배틀을 한 번 마치면 여기에 기록이 쌓여요."
          action={<ButtonLink to={`/courses/${courseId}/battle`}>배틀하러 가기</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col gap-3" aria-label="배틀 기록">
          {records.data.items!.map((battle) => {
            const link = linkOf(battle)
            const practice = battle.mode === 'PRACTICE'
            return (
              <li key={battle.id}>
                <Card padding="sm" className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-14 text-ink">
                      <span className="truncate">{battle.unit?.title}</span>
                      <Pill>{practice ? '연습 · 랭킹 미반영' : '랭킹 배틀'}</Pill>
                    </p>
                    <p className="text-11 text-muted">
                      {[
                        formatKst(battle.createdAt),
                        battle.status ? STATUS_LABEL[battle.status] : null,
                        battle.result ? RESULT_SHORT[battle.result] : null,
                        battle.status === 'FINISHED'
                          ? `내 점수 ${formatScore(battle.myScore)}`
                          : null,
                        battle.opponent?.nickname ? `상대 ${battle.opponent.nickname}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  {link && (
                    <ButtonLink variant="secondary" to={link}>
                      열기
                    </ButtonLink>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
      {records.data && (
        <Pager
          page={page}
          hasNext={records.data.hasNext ?? false}
          onChange={setPage}
          disabled={records.isFetching}
        />
      )}
    </>
  )
}
