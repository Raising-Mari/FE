import { useState } from 'react'
import { getErrorMessage } from '@/api/errorMessages'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toastStore'
import type { MergeSuggestion, TeachingTurn } from '../api'

interface TurnNoticesProps {
  turn: TeachingTurn
  merging: boolean
  /** 합치기를 눌렀을 때. 끝나면 resolve, 실패하면 reject 한다. */
  onMerge: (suggestion: MergeSuggestion) => Promise<unknown>
}

/**
 * 제자 답 바로 아래에 놓는 이번 턴의 안내: 비슷한 노트 합치기 확인 카드, 노트 가득 참, 일부 반려, 복붙 경고.
 * 서버는 합치기 제안을 저장하지 않으므로 "그대로 두기"를 누르거나 화면을 떠나면 카드는 사라진다.
 */
export function TurnNotices({ turn, merging, onMerge }: TurnNoticesProps) {
  const changes = turn.noteChanges
  const [hidden, setHidden] = useState<number[]>([])
  const suggestions = (changes?.mergeSuggestions ?? []).filter(
    (s) => s.newEntryId && !hidden.includes(s.newEntryId),
  )
  const autoMerged = changes?.merged?.length ?? 0
  const hide = (s: MergeSuggestion) => setHidden((prev) => [...prev, s.newEntryId ?? 0])

  const notices: string[] = []
  if (changes?.noteLimitReached)
    notices.push(
      '노트가 가득 찼어요. 새 노트만 못 들어가고, 기존 노트를 고치거나 지우는 것은 대화로 할 수 있어요.',
    )
  if ((changes?.rejectedCount ?? 0) > 0)
    notices.push('이 부분은 노트에 담기지 않았어요. 더 구체적으로 설명해 보세요.')
  if (turn.pasteWarning)
    notices.push('자료의 문장과 많이 겹쳐요. 내 말로 풀어서 설명하면 배틀에서 점수가 더 잘 나와요.')
  if (autoMerged > 0) notices.push(`거의 같은 노트 ${autoMerged}개는 하나로 합쳤어요.`)

  if (suggestions.length === 0 && notices.length === 0) return null

  return (
    <div className="ml-11 flex max-w-[420px] flex-col gap-2">
      {suggestions.map((suggestion) => (
        <section
          key={suggestion.newEntryId}
          aria-label="비슷한 노트 합치기"
          className="rounded-md border border-line-emphasis bg-surface-soft p-3"
        >
          <p className="text-11 text-ink-soft">비슷한 노트가 이미 있어요. 하나로 합칠까요?</p>
          <p className="mt-1 text-11 text-ink">“{suggestion.existingContent}”</p>
          <div className="mt-2 flex gap-2">
            <Button
              loading={merging}
              onClick={() => {
                onMerge(suggestion)
                  .then(() => {
                    hide(suggestion)
                    toast.info('노트를 하나로 합쳤어요.')
                  })
                  .catch((error: unknown) => toast.error(getErrorMessage(error)))
              }}
            >
              합치기
            </Button>
            <Button variant="secondary" disabled={merging} onClick={() => hide(suggestion)}>
              그대로 두기
            </Button>
          </div>
        </section>
      ))}
      {notices.map((notice) => (
        <p
          key={notice}
          role="status"
          className="rounded-md border border-line-strong bg-canvas px-3 py-2 text-11 text-muted"
        >
          {notice}
        </p>
      ))}
    </div>
  )
}
