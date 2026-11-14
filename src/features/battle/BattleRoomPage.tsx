import { useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { getErrorMessage, hasErrorCode } from '@/api/errorMessages'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Dialog } from '@/components/ui/Dialog'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pill } from '@/components/ui/Pill'
import { Spinner } from '@/components/ui/Spinner'
import { StateBox } from '@/components/ui/StateBox'
import { parseId } from '@/hooks/useCourseQueries'
import { formatKst } from '@/lib/datetime'
import { toast } from '@/stores/toastStore'
import type { Battle, BattleStatus, Participant } from './api'
import { BattleErrorNotice } from './components/BattleErrorNotice'
import { useBattle, useBattleActions } from './hooks/useBattle'
import { recallNotesPublic } from '@/lib/notesPublicPref'

const STATUS_LABEL: Record<BattleStatus, string> = {
  WAITING: '상대 입장 대기',
  LOBBY: '준비 대기',
  RUNNING: '풀이·채점 중',
  FINISHED: '완료',
  CANCELED: '취소됨',
  EXPIRED: '만료됨',
  ERROR: '오류',
}

function Side({ participant, fallback }: { participant?: Participant; fallback: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-lg bg-surface-muted px-4 py-5">
      <span className="text-14 text-ink">{participant?.nickname ?? fallback}</span>
      <span className="text-11 text-muted">
        {!participant ? '입장 전' : participant.status === 'READY' ? '준비 완료' : '준비 전'}
      </span>
    </div>
  )
}

async function copy(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.info(done)
  } catch {
    toast.error('복사하지 못했어요. 직접 선택해서 복사해 주세요.')
  }
}

/** 배틀 대기실·진행·오류(시안 13~16). 상태는 서버에서 2.5초마다 다시 받으므로 새로고침해도 이어진다. */
export function BattleRoomPage() {
  const battleId = parseId(useParams().battleId)
  const battle = useBattle(battleId)

  if (!battleId) return <StateBox kind="error" title="배틀 주소를 확인해주세요" />
  if (battle.isPending) return <StateBox kind="loading" />
  if (battle.isError && !battle.data)
    return <ErrorState error={battle.error} onRetry={() => void battle.refetch()} />
  if (!battle.data) return <StateBox kind="loading" />

  const data = battle.data
  if (data.status === 'FINISHED')
    return (
      <Navigate
        to={`/battles/${battleId}/${data.mode === 'PRACTICE' ? 'result' : 'review'}`}
        replace
      />
    )
  return <Room key={battleId} battleId={battleId} battle={data} />
}

function Room({ battleId, battle }: { battleId: number; battle: Battle }) {
  const { ready, cancel, retry } = useBattleActions(battleId)
  const [notesPublic, setNotesPublic] = useState(() => recallNotesPublic(battleId))
  const [confirmCancel, setConfirmCancel] = useState(false)

  const status = battle.status ?? 'WAITING'
  const practice = battle.mode === 'PRACTICE'
  const me = battle.participants?.find((p) => p.isMe)
  const opponent = battle.participants?.find((p) => !p.isMe)
  const iAmReady = me?.status === 'READY'
  const courseId = battle.course?.id
  const teachLink = `/courses/${courseId}/teach?unitId=${battle.unit?.id}`
  const joinLink = `${window.location.origin}/join/${battle.roomCode}`
  const closed = status === 'CANCELED' || status === 'EXPIRED'
  const busy = ready.isPending || cancel.isPending || retry.isPending

  function doCancel() {
    cancel.mutate(undefined, {
      onSuccess: () => setConfirmCancel(false),
      onError: (error) => {
        setConfirmCancel(false)
        toast.error(getErrorMessage(error))
      },
    })
  }

  return (
    <>
      <PageHeader
        crumbs={['내 과목', battle.course?.name, practice ? '연습 배틀' : '배틀 대기실']}
        title={practice ? '고친 설명으로 다시 풀어봐요.' : '우리 제자들의 대결.'}
        sub={`${battle.unit?.title ?? ''} · ${battle.questionCount ?? 0}문제`}
      />

      {closed ? (
        <StateBox
          kind="empty"
          title={status === 'CANCELED' ? '취소된 방이에요' : '시간이 지나 닫힌 방이에요'}
          message={
            status === 'CANCELED'
              ? '참가자가 방을 닫았어요. 레이팅은 바뀌지 않았어요.'
              : '상대가 들어오지 않아 방이 닫혔어요. 새로 만들어 주세요.'
          }
          action={<ButtonLink to={`/courses/${courseId}/battle`}>새 배틀 만들기</ButtonLink>}
        />
      ) : (
        <Card as="section" aria-label="배틀 방" className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            {practice ? (
              <p className="text-18 text-ink">연습 배틀 · 랭킹에 반영되지 않아요</p>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-18 text-ink">방 코드 {battle.roomCode}</p>
                {(status === 'WAITING' || status === 'LOBBY') && (
                  <>
                    <Button
                      variant="link"
                      onClick={() => void copy(battle.roomCode ?? '', '방 코드를 복사했어요.')}
                    >
                      코드 복사
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => void copy(joinLink, '입장 링크를 복사했어요.')}
                    >
                      링크 복사
                    </Button>
                  </>
                )}
              </div>
            )}
            <Pill role="status" aria-label={`방 상태: ${STATUS_LABEL[status]}`}>
              {STATUS_LABEL[status]}
            </Pill>
          </div>

          {!practice && (
            <div className="flex items-center gap-4">
              <Side participant={me} fallback="나" />
              <span className="text-18 text-navy">VS</span>
              <Side participant={opponent} fallback="상대" />
            </div>
          )}

          {!practice && (
            <div className="text-11 text-muted">
              <p>
                {iAmReady
                  ? '내 노트가 확정됐어요. 이후 수정은 이번 배틀에 반영되지 않아요.'
                  : '준비 완료를 누르는 순간의 노트가 확정돼요.'}
              </p>
              {(status === 'WAITING' || status === 'LOBBY') && (
                <p>대기 만료 {formatKst(battle.expiresAt)} · 결과는 상태를 확인해 갱신돼요.</p>
              )}
            </div>
          )}

          {status === 'LOBBY' && !iAmReady && (
            <Checkbox
              checked={notesPublic}
              onChange={(e) => setNotesPublic(e.target.checked)}
              disabled={busy}
              label="배틀 후 상대에게 내 노트 공개에 동의해요."
            />
          )}

          {ready.isError &&
            (hasErrorCode(ready.error, 'CONFLICT') ? (
              <p role="alert" className="text-12 text-danger">
                아직 준비할 수 없어요. 상대가 들어온 뒤에 다시 눌러 주세요.
              </p>
            ) : (
              <BattleErrorNotice error={ready.error} courseId={courseId} />
            ))}

          {status === 'RUNNING' && (
            <div
              role="status"
              className="flex flex-col items-center gap-2 rounded-lg bg-surface-tint px-6 py-8 text-center"
            >
              <p className="text-10 tracking-eyebrow text-subtle">MARI&apos;S STUDY ROOM</p>
              <p className="flex items-center gap-2 text-18 text-ink">
                <Spinner className="text-primary" />
                마리가 문제를 풀고 있어요
              </p>
              <p className="text-11 text-muted">
                확정된 노트만 살펴보고 있어요. 잠시만 기다려주세요.
              </p>
            </div>
          )}

          {status === 'ERROR' && (
            <div role="alert" className="flex flex-col gap-1">
              <p className="text-12 text-danger">
                풀이가 재시도 후에도 실패했어요. 레이팅은 바뀌지 않았어요.
              </p>
              {retry.isError && (
                <p className="text-11 text-danger">{getErrorMessage(retry.error)}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {status === 'WAITING' && <Button disabled>상대 입장을 기다려요</Button>}
            {status === 'LOBBY' &&
              (iAmReady ? (
                <Button disabled>상대 준비를 기다려요</Button>
              ) : (
                <Button loading={ready.isPending} onClick={() => ready.mutate(notesPublic)}>
                  준비 완료
                </Button>
              ))}
            {status === 'ERROR' && (
              <Button loading={retry.isPending} disabled={busy} onClick={() => retry.mutate()}>
                다시 시도
              </Button>
            )}
            {(status === 'WAITING' || status === 'LOBBY' || status === 'ERROR') && (
              <Button variant="secondary" disabled={busy} onClick={() => setConfirmCancel(true)}>
                {status === 'ERROR' ? '포기하고 나가기' : '방 취소'}
              </Button>
            )}
            {(status === 'WAITING' || (status === 'LOBBY' && !iAmReady)) && (
              <ButtonLink variant="secondary" to={teachLink}>
                노트 보러 가기
              </ButtonLink>
            )}
          </div>
        </Card>
      )}

      {confirmCancel && (
        <Dialog
          open
          title={status === 'ERROR' ? '포기하고 나가기' : '방 취소'}
          onClose={() => setConfirmCancel(false)}
          dismissible={!cancel.isPending}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setConfirmCancel(false)}
                disabled={cancel.isPending}
              >
                돌아가기
              </Button>
              <Button onClick={doCancel} loading={cancel.isPending}>
                {status === 'ERROR' ? '포기하기' : '방 닫기'}
              </Button>
            </>
          }
        >
          <p className="text-12 text-ink">
            방 전체가 닫히고 상대도 함께 나가게 돼요. 레이팅은 바뀌지 않아요.
          </p>
        </Dialog>
      )}
    </>
  )
}
