import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/api/errorMessages'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { ErrorState } from '@/components/ui/ErrorState'
import { Select } from '@/components/ui/Select'
import { StateBox } from '@/components/ui/StateBox'
import { Textarea } from '@/components/ui/Textarea'
import { recallNotesPublic, rememberNotesPublic } from '@/lib/notesPublicPref'
import { toast } from '@/stores/toastStore'
import type { NoteReviews } from '../api'
import {
  useNoteReviews,
  useOpponentNotes,
  useUpdateNotesPublic,
  useWriteNoteReview,
} from '../hooks/useReview'

type NoteReview = NonNullable<NoteReviews['written']>

function ReviewView({ title, review }: { title: string; review: NoteReview }) {
  return (
    <Card tone="soft" padding="sm" className="flex flex-col gap-1">
      <p className="text-11 text-ink-soft">{title}</p>
      <p className="text-12 text-ink">좋았던 점: {review.goodPoints}</p>
      <p className="text-12 text-ink">보완할 점: {review.suggestions}</p>
      {review.evidenceNote?.content && (
        <p className="text-11 text-muted">근거 노트: “{review.evidenceNote.content}”</p>
      )}
    </Card>
  )
}

/**
 * 서로의 노트 교환 리뷰(시안 20). 두 사람이 모두 공개에 동의한 배틀에서만 상대 노트가 오고 리뷰를 쓸 수 있다.
 * 서버가 내 동의 여부를 따로 알려 주지 않아서, 체크 상태는 "상대 노트를 받았는가"와 이 탭에서 고른 값으로 정한다.
 */
export function NoteExchange({ battleId }: { battleId: number }) {
  const notes = useOpponentNotes(battleId)
  const reviews = useNoteReviews(battleId)
  const update = useUpdateNotesPublic(battleId)
  const write = useWriteNoteReview(battleId)
  const [chosen, setChosen] = useState<boolean | null>(null)
  const [good, setGood] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [evidence, setEvidence] = useState('')
  const [failure, setFailure] = useState<string | null>(null)

  const shared = !!notes.data
  const agreed = chosen ?? (shared || recallNotesPublic(battleId))
  const opponent = notes.data?.opponent?.nickname ?? '상대'

  function toggle(next: boolean) {
    setChosen(next)
    update.mutate(next, {
      onSuccess: () => rememberNotesPublic(battleId, next),
      onError: (error) => {
        setChosen(!next)
        toast.error(getErrorMessage(error))
      },
    })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!good.trim() || !suggestions.trim() || write.isPending) return
    setFailure(null)
    write.mutate(
      {
        goodPoints: good.trim(),
        suggestions: suggestions.trim(),
        evidenceNoteEntryId: evidence ? Number(evidence) : undefined,
      },
      {
        onSuccess: () => toast.info('리뷰를 보냈어요.'),
        onError: (error) => setFailure(getErrorMessage(error)),
      },
    )
  }

  return (
    <Card as="section" aria-labelledby="note-exchange-title" className="flex flex-col gap-4">
      <h2 id="note-exchange-title" className="text-18 text-ink">
        서로의 노트 교환 리뷰
      </h2>
      <Checkbox
        checked={agreed}
        disabled={update.isPending}
        onChange={(e) => toggle(e.target.checked)}
        label="상대에게 내 배틀 노트 공개에 동의해요."
      />

      {notes.isPending ? (
        <StateBox kind="loading" className="border-0" />
      ) : notes.isError ? (
        <ErrorState error={notes.error} onRetry={() => void notes.refetch()} className="border-0" />
      ) : !notes.data ? (
        <p className="text-12 text-muted">
          {agreed
            ? '공개되지 않은 노트예요. 상대도 동의하면 서로의 노트가 보여요.'
            : '양쪽 모두 동의한 뒤에만 상대 노트가 보여요.'}
        </p>
      ) : (
        <>
          <div>
            <h3 className="mb-2 text-14 text-ink">{opponent}의 배틀 노트</h3>
            {(notes.data.notes ?? []).length === 0 ? (
              <p className="text-12 text-muted">상대가 준비한 노트가 없어요.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {notes.data.notes!.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-md border border-line-soft bg-surface-soft px-3 py-2 text-12 break-words text-ink"
                  >
                    {note.content}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {reviews.data?.received && (
            <ReviewView title={`${opponent}가 남긴 리뷰`} review={reviews.data.received} />
          )}

          {reviews.isPending ? (
            <StateBox kind="loading" className="border-0" />
          ) : reviews.isError ? (
            <ErrorState
              error={reviews.error}
              onRetry={() => void reviews.refetch()}
              className="border-0"
            />
          ) : reviews.data.written ? (
            <ReviewView title="내가 남긴 리뷰" review={reviews.data.written} />
          ) : (
            <form className="flex flex-col gap-3" onSubmit={submit}>
              <h3 className="text-14 text-ink">교환 리뷰 의견</h3>
              <div className="grid grid-cols-2 gap-3">
                <Textarea
                  label="좋았던 점"
                  value={good}
                  onChange={(e) => setGood(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  required
                  disabled={write.isPending}
                />
                <Textarea
                  label="보완할 점"
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  required
                  disabled={write.isPending}
                />
              </div>
              <Select
                label="근거가 된 노트 (선택)"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                disabled={write.isPending}
              >
                <option value="">고르지 않음</option>
                {(notes.data.notes ?? []).map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.content}
                  </option>
                ))}
              </Select>
              {failure && (
                <p role="alert" className="text-12 text-danger">
                  {failure}
                </p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-10 text-subtle">리뷰는 배틀마다 한 번만 보낼 수 있어요.</p>
                <Button
                  type="submit"
                  loading={write.isPending}
                  disabled={!good.trim() || !suggestions.trim()}
                >
                  리뷰 보내기
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </Card>
  )
}
