import { useState } from 'react'
import { getErrorMessage } from '@/api/errorMessages'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Disclosure } from '@/components/ui/Disclosure'
import { Pill } from '@/components/ui/Pill'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { formatScore } from '@/lib/datetime'
import { VERDICT_LABEL } from '@/lib/verdict'
import { toast } from '@/stores/toastStore'
import { CAUSE_LABEL, CAUSE_SUGGESTION, type ReviewCause, type ReviewItem } from '../api'
import { useSaveReview } from '../hooks/useReview'
import { ReportDialog } from './ReportDialog'

interface ReviewItemCardProps {
  battleId: number
  item: ReviewItem
  revealed: boolean
  selected: boolean
  onSelect: (checked: boolean) => void
}

const CAUSES = Object.keys(CAUSE_LABEL) as ReviewCause[]

/**
 * 복기의 문항 하나(시안 17·19): 제자의 답과 근거가 된 노트, 원인 선택과 메모, 신고.
 * 모범 답과 자료 근거는 정답 보기 뒤에만 응답에 있고, 그 전에는 화면에서 만들어 내지 않는다.
 */
export function ReviewItemCard({
  battleId,
  item,
  revealed,
  selected,
  onSelect,
}: ReviewItemCardProps) {
  const { disciple, question, myReview } = item
  const correct = disciple.verdict === 'CORRECT'
  const [cause, setCause] = useState<ReviewCause | ''>(myReview?.userCause ?? '')
  const [memo, setMemo] = useState(myReview?.studyMemo ?? '')
  const [source, setSource] = useState(myReview?.sourceNote ?? '')
  const [reason, setReason] = useState(myReview?.reasonNote ?? '')
  const [reporting, setReporting] = useState(false)
  const save = useSaveReview(battleId)
  const titleId = `review-item-${item.battleAnswerId}`

  function submit() {
    if (!cause) return
    save.mutate(
      {
        answerId: item.battleAnswerId,
        // 저장은 모든 칸을 덮어쓰므로, 이 화면에서 다루지 않는 칸(aiMemo)도 있던 값을 그대로 보낸다.
        review: {
          userCause: cause,
          studyMemo: memo.trim() || undefined,
          aiMemo: myReview?.aiMemo ?? undefined,
          sourceNote: source.trim() || undefined,
          reasonNote: reason.trim() || undefined,
        },
      },
      {
        onSuccess: () => toast.info('복기를 저장했어요.'),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    )
  }

  return (
    <Card as="article" aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          aria-label={`${item.seq}번 문제를 연습에 넣기`}
          checked={selected}
          disabled={!item.practiceAvailable}
          onChange={(e) => onSelect(e.target.checked)}
          className="mt-1.5 size-4 shrink-0 accent-primary disabled:opacity-45"
        />
        <h3 id={titleId} className="flex-1 text-14 text-ink">
          {item.seq}. {question.stem}
        </h3>
        <Pill>
          {VERDICT_LABEL[disciple.verdict]} · {formatScore(disciple.finalScore)}
        </Pill>
      </div>

      {disciple.injectionFlag && (
        <p className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-11 text-danger">
          채점 조작 의심으로 0점 처리됐어요. 잘못된 판단이라면 이의제기할 수 있어요.
        </p>
      )}

      <div className={revealed ? 'grid grid-cols-3 gap-3' : 'grid grid-cols-2 gap-3'}>
        <Card tone="soft" padding="sm">
          <p className="text-11 text-ink-soft">제자 답</p>
          <p className="text-12 break-words text-ink">
            {disciple.answerText || '답을 내지 못했어요.'}
          </p>
        </Card>
        <Card tone="soft" padding="sm">
          <p className="text-11 text-ink-soft">
            사용한 노트 {item.usedNotes.length}개 · 복붙 계수 {formatScore(disciple.copyFactor)}
          </p>
          {item.usedNotes.length === 0 ? (
            <p className="text-12 text-muted">이 답에 쓰인 노트가 없어요.</p>
          ) : (
            <ul className="list-disc pl-4 text-12 text-ink">
              {item.usedNotes.map((note) => (
                <li key={note.id} className="break-words">
                  {note.content}
                </li>
              ))}
            </ul>
          )}
        </Card>
        {revealed && (
          <Card tone="soft" padding="sm">
            <p className="text-11 text-ink-soft">모범 답</p>
            <p className="text-12 break-words text-ink">
              {question.referenceAnswer ?? '모범 답이 없어요.'}
            </p>
            <p className="mt-2 text-11 text-ink-soft">자료 근거</p>
            {item.evidence ? (
              <>
                <p className="text-12 break-words text-ink">{item.evidence.text}</p>
                {item.evidence.materialTitle && (
                  <p className="text-10 text-subtle">{item.evidence.materialTitle}</p>
                )}
              </>
            ) : (
              <p className="text-12 text-muted">연결된 자료 근거가 없어요.</p>
            )}
          </Card>
        )}
      </div>

      {!revealed && (
        <p className="text-11 text-subtle">모범 답과 자료 근거는 정답 보기 전까지 숨겨져 있어요.</p>
      )}

      {!correct && (
        <>
          {item.causeSuggestion && (
            <p className="text-11 text-muted">
              원인 제안: {CAUSE_SUGGESTION[item.causeSuggestion]}
            </p>
          )}
          <div className="grid grid-cols-[240px_minmax(0,1fr)] gap-3">
            <Select
              label="내가 생각하는 원인"
              value={cause}
              onChange={(e) => setCause(e.target.value as ReviewCause | '')}
              disabled={save.isPending}
            >
              <option value="">직접 선택해주세요</option>
              {CAUSES.map((value) => (
                <option key={value} value={value}>
                  {CAUSE_LABEL[value]}
                </option>
              ))}
            </Select>
            <Textarea
              label="복기 메모"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="다음에는 어떻게 설명할까요?"
              maxLength={1000}
              rows={2}
              disabled={save.isPending}
            />
          </div>
          <Disclosure
            summary="보완한 내용의 출처와 고른 이유 남기기"
            defaultOpen={!!(myReview?.sourceNote || myReview?.reasonNote)}
          >
            <div className="grid grid-cols-2 gap-3">
              <Textarea
                label="어디서 찾아봤나요? (출처)"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="예: 3주차 강의자료 12쪽, 교재 4장"
                maxLength={1000}
                rows={2}
                disabled={save.isPending}
              />
              <Textarea
                label="왜 그 내용을 골랐나요?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 강의자료의 정의가 교재보다 정확해서"
                maxLength={1000}
                rows={2}
                disabled={save.isPending}
              />
            </div>
          </Disclosure>
        </>
      )}

      <div className="flex items-center justify-between">
        <Button variant="link" onClick={() => setReporting(true)}>
          {disciple.injectionFlag ? '채점 이의제기' : '문제·채점 신고'}
        </Button>
        {!correct && (
          <Button variant="secondary" disabled={!cause} loading={save.isPending} onClick={submit}>
            복기 저장
          </Button>
        )}
      </div>

      {reporting && (
        <ReportDialog
          answerId={item.battleAnswerId}
          stem={question.stem}
          defaultKind={disciple.injectionFlag ? 'GRADING' : 'QUESTION'}
          onClose={() => setReporting(false)}
        />
      )}
    </Card>
  )
}
