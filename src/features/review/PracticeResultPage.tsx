import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { hasErrorCode } from '@/api/errorMessages'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { StateBox } from '@/components/ui/StateBox'
import { parseId } from '@/hooks/useCourseQueries'
import { formatScore } from '@/lib/datetime'
import { VERDICT_LABEL } from '@/lib/verdict'
import { RevealDialog } from './components/RevealDialog'
import { useBattleInfo, useResult } from './hooks/useReview'

/**
 * 연습 결과(시안 18): 문항마다 이전 배틀의 결과와 이번 연습의 답을 나란히 보여 준다.
 * 정답은 싣지 않고, 여기서 새 연습을 시작하지도 않는다(연쇄 금지) — 원래 배틀의 복기로 돌아가서 한다.
 */
export function PracticeResultPage() {
  const battleId = parseId(useParams().battleId)
  const navigate = useNavigate()
  const battle = useBattleInfo(battleId)
  const result = useResult(battleId)
  const [revealing, setRevealing] = useState(false)

  if (!battleId) return <StateBox kind="error" title="배틀 주소를 확인해주세요" />
  if (result.isPending) return <StateBox kind="loading" />
  if (result.isError) {
    if (hasErrorCode(result.error, 'BATTLE_NOT_FINISHED'))
      return <Navigate to={`/battles/${battleId}`} replace />
    return <ErrorState error={result.error} onRetry={() => void result.refetch()} />
  }
  if (result.data.mode !== 'PRACTICE')
    return <Navigate to={`/battles/${battleId}/review`} replace />

  const source = result.data.sourceBattleId
  const sourceLink = source ? `/battles/${source}/review` : '/courses'
  const courseId = battle.data?.course?.id
  const questions = result.data.questions ?? []

  return (
    <>
      <PageHeader
        crumbs={['내 과목', battle.data?.course?.name, '연습 결과']}
        title="고친 설명이 어떻게 달라졌을까요?"
        sub="연습 결과에서는 새 연습을 시작하지 않아요. 원래 복기로 돌아가주세요."
      />
      <div className="mb-5 flex flex-wrap gap-3">
        <ButtonLink to={sourceLink}>원래 배틀 복기로 돌아가기</ButtonLink>
        <ButtonLink
          variant="secondary"
          to={courseId ? `/courses/${courseId}/teach?unitId=${battle.data?.unit?.id}` : '/courses'}
        >
          노트 고치러 가기
        </ButtonLink>
        {source && (
          <Button variant="secondary" onClick={() => setRevealing(true)}>
            정답 보기
          </Button>
        )}
      </div>

      {questions.length === 0 ? (
        <StateBox kind="empty" title="연습한 문제가 없어요" />
      ) : (
        <div className="flex flex-col gap-4">
          {questions.map((question) => (
            <Card as="article" key={question.seq} className="flex flex-col gap-3">
              <h2 className="text-14 text-ink">{question.stem}</h2>
              <div className="grid grid-cols-2 gap-3">
                <Card tone="soft" padding="sm">
                  <p className="text-11 text-ink-soft">이전 배틀</p>
                  <p className="text-12 text-ink">
                    {question.retestOf?.verdict
                      ? VERDICT_LABEL[question.retestOf.verdict]
                      : '기록 없음'}
                  </p>
                </Card>
                <Card tone="soft" padding="sm">
                  <p className="text-11 text-ink-soft">이번 연습</p>
                  <p className="text-12 break-words text-ink">
                    {question.myAnswerText || '답을 내지 못했어요.'}
                  </p>
                  <p className="text-11 text-muted">
                    {question.myVerdict ? VERDICT_LABEL[question.myVerdict] : '—'} ·{' '}
                    {formatScore(question.myScore)}
                  </p>
                </Card>
              </div>
              <p className="text-11 text-subtle">
                정답은 공개하지 않았어요. 연습은 Elo에 반영되지 않아요.
              </p>
            </Card>
          ))}
        </div>
      )}

      {revealing && source && (
        <RevealDialog
          battleId={source}
          onClose={() => setRevealing(false)}
          onRevealed={() => navigate(sourceLink)}
        />
      )}
    </>
  )
}
