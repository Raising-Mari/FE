import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { getErrorMessage, hasErrorCode } from '@/api/errorMessages'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { Disclosure } from '@/components/ui/Disclosure'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pill } from '@/components/ui/Pill'
import { StateBox } from '@/components/ui/StateBox'
import { parseId } from '@/hooks/useCourseQueries'
import { formatDelta, formatScore } from '@/lib/datetime'
import { RESULT_LABEL } from '@/lib/verdict'
import { toast } from '@/stores/toastStore'
import type { ReviewItem } from './api'
import { NoteExchange } from './components/NoteExchange'
import { RevealDialog } from './components/RevealDialog'
import { ReviewItemCard } from './components/ReviewItemCard'
import { useBattleInfo, useResult, useReview, useStartPractice } from './hooks/useReview'

const SCORE_RULE =
  '정답 +1 · 부분 정답 +0.5 · 모름 0 · 오답 −0.5(목록형) / −0.3(요소형) · 정답·부분 정답에만 원문 겹침 계수 반영'

/** 결과·복기(시안 17·19·20·21). 끝난 랭킹 배틀에서만 열리고, 연습 배틀이면 연습 결과로 보낸다. */
export function ReviewPage() {
  const battleId = parseId(useParams().battleId)
  const navigate = useNavigate()
  const battle = useBattleInfo(battleId)
  const result = useResult(battleId)
  const ranked = result.data?.mode === 'RANKED'
  const review = useReview(battleId, ranked)
  const practice = useStartPractice(battleId)
  /** 학생이 직접 바꾼 선택만 기억한다. 건드리지 않은 문항은 "틀린 문제는 기본 선택" 규칙을 따른다. */
  const [overrides, setOverrides] = useState<Record<number, boolean>>({})
  const [revealing, setRevealing] = useState(false)

  if (!battleId) return <StateBox kind="error" title="배틀 주소를 확인해주세요" />
  if (result.isPending) return <StateBox kind="loading" />
  if (result.isError) {
    if (hasErrorCode(result.error, 'BATTLE_NOT_FINISHED'))
      return <Navigate to={`/battles/${battleId}`} replace />
    return <ErrorState error={result.error} onRetry={() => void result.refetch()} />
  }
  if (result.data.mode === 'PRACTICE')
    return <Navigate to={`/battles/${battleId}/result`} replace />

  const data = result.data
  const items = review.data?.items ?? []
  const revealed = review.data?.answersRevealed ?? false
  const isSelected = (item: ReviewItem) =>
    item.practiceAvailable &&
    (overrides[item.battleAnswerId] ?? item.disciple.verdict !== 'CORRECT')
  const selectedIds = items.filter(isSelected).map((item) => item.battleAnswerId)
  const missed = items.filter((item) => item.disciple.verdict !== 'CORRECT')
  const correct = items.filter((item) => item.disciple.verdict === 'CORRECT')
  const courseId = battle.data?.course?.id
  const teachLink = courseId
    ? `/courses/${courseId}/teach?unitId=${battle.data?.unit?.id}`
    : '/courses'

  function start() {
    practice.mutate(selectedIds, {
      onSuccess: (created) => {
        if ((created.skippedAnswerIds?.length ?? 0) > 0)
          toast.info(
            `검토 중이거나 빠진 문제 ${created.skippedAnswerIds!.length}개는 건너뛰었어요.`,
          )
        if (created.id) navigate(`/battles/${created.id}`)
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    })
  }

  const card = (item: ReviewItem) => (
    <ReviewItemCard
      key={item.battleAnswerId}
      battleId={battleId}
      item={item}
      revealed={revealed}
      selected={isSelected(item)}
      onSelect={(checked) => setOverrides((prev) => ({ ...prev, [item.battleAnswerId]: checked }))}
    />
  )

  return (
    <>
      <PageHeader
        crumbs={['내 과목', battle.data?.course?.name, '결과·복기']}
        title="한 번의 배틀, 다음 배움의 시작."
        sub={[
          battle.data?.course?.name,
          battle.data?.unit?.title,
          `${data.questions?.length ?? 0}문제`,
        ]
          .filter(Boolean)
          .join(' · ')}
      />

      <Card as="section" aria-label="배틀 결과" className="mb-5 flex flex-col gap-3">
        <div className="flex items-center gap-5">
          <Pill>{data.result ? RESULT_LABEL[data.result] : '결과 없음'}</Pill>
          <p className="text-43 text-navy" aria-label="내 점수 대 상대 점수">
            {formatScore(data.me?.totalScore)} : {formatScore(data.opponent?.totalScore)}
          </p>
          {data.elo && (
            <p className="text-12 text-muted">
              Elo {data.elo.before} → {data.elo.after}{' '}
              <span className="text-navy">{formatDelta(data.elo.delta)}</span>
            </p>
          )}
        </div>
        <p className="text-10 text-subtle">{SCORE_RULE}</p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <ButtonLink to={teachLink}>노트 고치러 가기</ButtonLink>
          <Button
            variant="secondary"
            loading={practice.isPending}
            disabled={revealed || selectedIds.length === 0 || !review.data}
            onClick={start}
          >
            선택한 문제 연습
          </Button>
          <Button
            variant="secondary"
            disabled={revealed || !review.data}
            onClick={() => setRevealing(true)}
          >
            {revealed ? '정답 공개 · 이 배틀의 연습 종료' : '정답 보기'}
          </Button>
        </div>
        {!revealed && (
          <p className="text-11 text-subtle">
            틀린 문제는 기본 선택되어 있어요. 맞힌 문제도 선택할 수 있어요.
          </p>
        )}
      </Card>

      {review.isPending ? (
        <StateBox kind="loading" />
      ) : review.isError ? (
        <ErrorState error={review.error} onRetry={() => void review.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          {missed.length === 0 && (
            <StateBox
              kind="empty"
              title="틀린 문제가 없어요"
              message="모든 문제를 맞혔어요. 맞힌 문제도 골라서 다시 연습할 수 있어요."
            />
          )}
          {missed.map(card)}
          {correct.length > 0 && (
            <Disclosure summary={`맞힌 문제 ${correct.length}개`} className="p-4">
              <div className="flex flex-col gap-4">{correct.map(card)}</div>
            </Disclosure>
          )}
          <NoteExchange battleId={battleId} />
        </div>
      )}

      {revealing && <RevealDialog battleId={battleId} onClose={() => setRevealing(false)} />}
    </>
  )
}
