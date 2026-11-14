import { ButtonLink } from '@/components/ui/ButtonLink'
import { ErrorState } from '@/components/ui/ErrorState'
import { StateBox } from '@/components/ui/StateBox'
import { useNotes } from '../hooks/useTeaching'

interface NotePanelProps {
  courseId: number
  discipleId: number
  unitId: number
}

/**
 * 배운 노트(시안 09 오른쪽). 읽기 전용이다 — 고치거나 지우는 버튼을 두지 않고 대화로 하게 안내한다.
 * 번호는 화면 표시용일 뿐 서버가 알아듣는 값이 아니다.
 */
export function NotePanel({ courseId, discipleId, unitId }: NotePanelProps) {
  const notes = useNotes(discipleId, unitId)
  const group = notes.data
  const items = group?.items ?? []
  const count = group?.count ?? items.length
  const limit = group?.limit ?? 60

  return (
    <section
      aria-labelledby="notes-title"
      className="flex h-[640px] min-w-0 flex-col rounded-lg border border-line bg-surface"
    >
      <header className="border-b border-line px-5 py-3.5">
        <div className="flex items-baseline justify-between">
          <h2 id="notes-title" className="text-14 text-ink">
            배운 노트
          </h2>
          <span className="text-12 text-navy" aria-label={`노트 ${count}개, 최대 ${limit}개`}>
            {count} / {limit}
          </span>
        </div>
        <p className="text-10 text-subtle">읽기 전용 · 수정·삭제는 대화로</p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-3">
        {notes.isPending ? (
          <StateBox kind="loading" className="border-0" />
        ) : notes.isError ? (
          <ErrorState
            error={notes.error}
            onRetry={() => void notes.refetch()}
            className="border-0"
          />
        ) : items.length === 0 ? (
          <StateBox
            kind="empty"
            className="border-0"
            title="아직 노트가 없어요"
            message="마리에게 설명하면 여기에 노트가 쌓여요."
          />
        ) : (
          <ol className="flex flex-col">
            {items.map((note, index) => (
              <li
                key={note.id}
                className="flex gap-3 border-b border-line-soft py-3 last:border-b-0"
              >
                <span className="w-5 shrink-0 text-11 text-subtle">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-12 break-words text-ink">{note.content}</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <footer className="flex flex-col gap-3 border-t border-line px-5 py-3.5">
        <p className="text-10 text-subtle">
          한 번의 노트는 5~300자예요. 여러 내용은 줄을 나눠 설명해주세요.
        </p>
        <ButtonLink to={`/courses/${courseId}/battle?unitId=${unitId}`} fullWidth>
          배틀하러 가기 →
        </ButtonLink>
      </footer>
    </section>
  )
}
