import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { getErrorMessage, hasErrorCode } from '@/api/errorMessages'
import mariRound from '@/assets/mari/mari_round.webp'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Spinner } from '@/components/ui/Spinner'
import { StateBox } from '@/components/ui/StateBox'
import { cx } from '@/lib/cx'
import { MAX_MESSAGE_LENGTH, type ChatMessage, type TeachingTurn } from '../api'
import { useMergeNotes, useMessages, useSendMessage } from '../hooks/useTeaching'
import { TurnNotices } from './TurnNotices'

interface ChatPanelProps {
  courseId: number
  discipleId: number
  discipleName: string
  myName: string
  unitId: number
  unitTitle: string
}

function MariFace() {
  return (
    <svg viewBox="75 30 610 625" aria-hidden="true" className="size-[34px] shrink-0 rounded-full">
      <image href={mariRound} width="1448" height="1086" />
    </svg>
  )
}

function Bubble({ message, who, mine }: { message: string; who: string; mine: boolean }) {
  return (
    <div className={cx('flex items-start gap-2.5', mine && 'flex-row-reverse')}>
      {mine ? <Avatar name={who} /> : <MariFace />}
      <div className={cx('flex max-w-[420px] flex-col gap-1', mine && 'items-end')}>
        <span className="text-10 text-subtle">{who}</span>
        <p
          className={cx(
            'rounded-lg px-3.5 py-2.5 text-12 break-words whitespace-pre-wrap',
            mine ? 'bg-primary text-white' : 'border border-line bg-surface-soft text-ink',
          )}
        >
          {message}
        </p>
      </div>
    </div>
  )
}

/** 마리와 가르치기(시안 09 가운데). 설명을 보내면 제자의 답과 노트 변경 안내가 이어진다. */
export function ChatPanel({
  courseId,
  discipleId,
  discipleName,
  myName,
  unitId,
  unitTitle,
}: ChatPanelProps) {
  const messages = useMessages(discipleId, unitId)
  const send = useSendMessage(courseId, discipleId, unitId)
  const merge = useMergeNotes(courseId, discipleId, unitId)
  const [draft, setDraft] = useState('')
  const [pasted, setPasted] = useState(false)
  /** 보내는 중이거나 실패해 다시 보낼 메시지. 같은 id 로 다시 보내야 두 번 저장되지 않는다. */
  const [outgoing, setOutgoing] = useState<{ content: string; clientMessageId: string } | null>(
    null,
  )
  /** 이번에 받은 턴의 안내(합치기 제안 등). 서버가 저장하지 않으므로 화면에만 둔다. */
  const [turns, setTurns] = useState<Record<number, TeachingTurn>>({})
  const logEnd = useRef<HTMLDivElement>(null)

  const count = messages.data?.length ?? 0
  useEffect(() => {
    logEnd.current?.scrollIntoView?.({ block: 'end' })
  }, [count, outgoing, send.isPending])

  function deliver(message: { content: string; clientMessageId: string }) {
    setOutgoing(message)
    send.mutate(message, {
      onSuccess: (turn) => {
        setOutgoing(null)
        if (turn.discipleMessage?.id) {
          const id = turn.discipleMessage.id
          setTurns((prev) => ({ ...prev, [id]: turn }))
        }
      },
    })
  }

  function submit() {
    const content = draft.trim()
    if (!content || send.isPending || outgoing) return
    setDraft('')
    setPasted(false)
    deliver({ content, clientMessageId: crypto.randomUUID() })
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // 한글 조합 중의 Enter 는 글자를 확정하는 것이라 보내지 않는다.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  const failed = send.isError && outgoing !== null
  const list: ChatMessage[] = messages.data ?? []
  const lastDisciple = [...list].reverse().find((m) => m.role === 'DISCIPLE')

  return (
    <section
      aria-labelledby="chat-title"
      className="flex h-[640px] min-w-0 flex-col rounded-lg border border-line bg-surface"
    >
      <header className="flex items-baseline justify-between border-b border-line px-5 py-3.5">
        <h2 id="chat-title" className="text-14 text-ink">
          {discipleName}와 가르치기
        </h2>
        <span className="text-11 text-subtle">{unitTitle}</span>
      </header>

      <div
        role="log"
        aria-label="대화"
        aria-live="polite"
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4"
      >
        {messages.isPending ? (
          <StateBox kind="loading" className="border-0" />
        ) : messages.isError ? (
          <ErrorState
            error={messages.error}
            onRetry={() => void messages.refetch()}
            className="border-0"
          />
        ) : list.length === 0 && !outgoing ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <MariFace />
            <p className="text-12 text-muted">네가 알려주는 설명으로 배울게.</p>
            <p className="text-11 text-subtle">이 주차에서 배운 내용을 내 말로 설명해 보세요.</p>
          </div>
        ) : (
          list.map((message) => (
            <div key={message.id} className="flex flex-col gap-2">
              <Bubble
                mine={message.role === 'STUDENT'}
                who={message.role === 'STUDENT' ? myName : discipleName}
                message={message.content ?? ''}
              />
              {message.id && turns[message.id] && (
                <TurnNotices
                  turn={turns[message.id]!}
                  merging={merge.isPending}
                  onMerge={(s) =>
                    merge.mutateAsync({
                      keepEntryId: s.newEntryId ?? 0,
                      mergeEntryId: s.existingEntryId ?? 0,
                    })
                  }
                />
              )}
            </div>
          ))
        )}

        {outgoing && (
          <div className="flex flex-col gap-2">
            <Bubble mine who={myName} message={outgoing.content} />
            {send.isPending && (
              <p role="status" className="flex items-center gap-2 text-11 text-subtle">
                <Spinner />
                {discipleName}가 설명을 읽고 있어요…
              </p>
            )}
            {failed && (
              <div
                role="alert"
                className="flex flex-col items-end gap-2 rounded-md border border-danger bg-danger-soft p-3"
              >
                <p className="self-stretch text-11 text-danger">
                  {hasErrorCode(send.error, 'TEACHING_CONCURRENT_TURN')
                    ? getErrorMessage(send.error)
                    : `보내지 못했어요. ${getErrorMessage(send.error)}`}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setDraft(outgoing.content)
                      setOutgoing(null)
                      send.reset()
                    }}
                  >
                    고쳐서 보내기
                  </Button>
                  <Button onClick={() => deliver(outgoing)}>다시 보내기</Button>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={logEnd} />
      </div>

      <form
        className="flex flex-col gap-2 border-t border-line px-5 py-3.5"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        {lastDisciple?.askedWhy && !outgoing && (
          <p className="text-11 text-ink-soft">
            {discipleName}의 질문: {lastDisciple.content}
          </p>
        )}
        {pasted && (
          <p role="status" className="text-11 text-muted">
            붙여넣은 글이에요. 자료를 그대로 옮기기보다 내 말로 풀어서 설명해 보세요.
          </p>
        )}
        <label htmlFor="teach-input" className="sr-only">
          설명 입력
        </label>
        <textarea
          id="teach-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={() => setPasted(true)}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={3}
          disabled={outgoing !== null}
          placeholder="설명을 적어주세요. 노트를 고치거나 지우고 싶을 때도 “아까 말한 ○○는 틀렸어, △△야”처럼 말하면 돼요."
          className="w-full resize-none rounded-md border border-line-strong bg-surface p-3 text-12 leading-[1.8] text-ink placeholder:text-placeholder disabled:opacity-45"
        />
        <div className="flex items-center justify-between">
          <span className="text-10 text-subtle">Enter 전송 · Shift+Enter 줄바꿈</span>
          <Button type="submit" disabled={!draft.trim() || outgoing !== null}>
            보내기 ↑
          </Button>
        </div>
      </form>
    </section>
  )
}
