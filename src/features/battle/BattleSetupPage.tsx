import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { ErrorState } from '@/components/ui/ErrorState'
import { Select } from '@/components/ui/Select'
import { StateBox } from '@/components/ui/StateBox'
import { TextInput } from '@/components/ui/TextInput'
import { parseId, useCourse, useUnits } from '@/hooks/useCourseQueries'
import { DEFAULT_QUESTIONS, MAX_QUESTIONS, MIN_QUESTIONS, normalizeRoomCode } from './api'
import { BattleErrorNotice } from './components/BattleErrorNotice'
import { useActiveBattle, useCreateBattle, useJoinBattle, useReadiness } from './hooks/useBattle'
import { rememberNotesPublic } from './notesPublicPref'

const COUNTS = Array.from(
  { length: MAX_QUESTIONS - MIN_QUESTIONS + 1 },
  (_, index) => MIN_QUESTIONS + index,
)

/** 배틀 만들기와 코드 입장(시안 12). 문제 내용은 배틀이 끝난 뒤에만 볼 수 있다. */
export function BattleSetupPage() {
  const courseId = parseId(useParams().courseId)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const course = useCourse(courseId)
  const units = useUnits(courseId)
  const active = useActiveBattle(courseId)

  const [picked, setPicked] = useState<number | null>(null)
  const [count, setCount] = useState(DEFAULT_QUESTIONS)
  const [notesPublic, setNotesPublic] = useState(false)
  const [code, setCode] = useState('')
  const [joinNotesPublic, setJoinNotesPublic] = useState(false)

  const requested = parseId(params.get('unitId') ?? undefined)
  const unit =
    units.data?.find((u) => u.id === (picked ?? requested)) ??
    units.data?.find((u) => (u.myNoteCount ?? 0) > 0) ??
    units.data?.[0]
  const unitId = unit?.id ?? 0
  const readiness = useReadiness(unitId, count)
  const create = useCreateBattle()
  const join = useJoinBattle()

  const noteCount = unit?.myNoteCount ?? 0
  const noNotes = !!unit && noteCount === 0
  const notEnough = readiness.data?.ready === false
  const canCreate = !!unit && !noNotes && !notEnough && !active.data && !create.isPending

  function submitCreate(event: FormEvent) {
    event.preventDefault()
    if (!canCreate) return
    create.mutate(
      { courseId, unitId, questionCount: count },
      {
        onSuccess: (battle) => {
          if (!battle.id) return
          rememberNotesPublic(battle.id, notesPublic)
          navigate(`/battles/${battle.id}`)
        },
      },
    )
  }

  function submitJoin(event: FormEvent) {
    event.preventDefault()
    const roomCode = normalizeRoomCode(code)
    if (!roomCode || join.isPending) return
    join.mutate(roomCode, {
      onSuccess: (battle) => {
        if (!battle.id) return
        rememberNotesPublic(battle.id, joinNotesPublic)
        navigate(`/battles/${battle.id}`)
      },
    })
  }

  if (!courseId) return <StateBox kind="error" title="과목 주소를 확인해주세요" />

  return (
    <>
      <PageHeader
        crumbs={['내 과목', course.data?.name, '제자 배틀']}
        title="가르친 만큼, 자신 있게."
        sub="문제는 배틀이 끝난 뒤에만 공개돼요."
      />
      {active.data?.id && (
        <Card tone="soft" padding="sm" className="mb-5 flex items-center justify-between gap-4">
          <p className="text-12 text-ink">
            진행 중인 배틀 방이 있어요. 끝내거나 취소해야 새 방을 만들 수 있어요.
          </p>
          <ButtonLink to={`/battles/${active.data.id}`}>진행 중인 방으로</ButtonLink>
        </Card>
      )}
      {units.isPending ? (
        <StateBox kind="loading" />
      ) : units.isError ? (
        <ErrorState error={units.error} onRetry={() => void units.refetch()} />
      ) : (
        <div className="grid grid-cols-2 items-start gap-6">
          <Card as="section" aria-labelledby="create-battle-title">
            <h2 id="create-battle-title" className="mb-5 text-18 text-ink">
              새 배틀 만들기
            </h2>
            {units.data.length === 0 ? (
              <StateBox
                kind="empty"
                className="border-0"
                title="아직 주차가 없어요"
                message="주차를 만들고 마리를 가르친 뒤에 배틀할 수 있어요."
                action={<ButtonLink to={`/courses/${courseId}`}>과목 홈으로</ButtonLink>}
              />
            ) : (
              <form className="flex flex-col gap-5" onSubmit={submitCreate}>
                <Select
                  label="주차"
                  value={unitId}
                  onChange={(e) => setPicked(Number(e.target.value))}
                  disabled={create.isPending}
                >
                  {units.data.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.title}
                    </option>
                  ))}
                </Select>
                <Select
                  label="문제 수"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  disabled={create.isPending}
                >
                  {COUNTS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
                <p className="text-11 text-muted" role="status">
                  내 노트 {noteCount}개 · 내가 안 본 문제{' '}
                  {readiness.isPending
                    ? '확인 중…'
                    : readiness.isError
                      ? '확인 실패'
                      : `${readiness.data.availableForMe ?? 0}개`}
                </p>
                {noNotes ? (
                  <div className="flex flex-col items-start gap-2">
                    <p className="text-12 text-danger">
                      이 주차에 내 노트가 없어요. 먼저 마리를 가르쳐 주세요.
                    </p>
                    <ButtonLink
                      variant="secondary"
                      to={`/courses/${courseId}/teach?unitId=${unitId}`}
                    >
                      먼저 가르치러 가기
                    </ButtonLink>
                  </div>
                ) : notEnough ? (
                  <p className="text-12 text-danger">
                    이 주차는 아직 배틀할 문제가 모자라요. 문제 수를 줄이거나 다른 주차를 골라
                    주세요. 자료를 주차에 연결하면 문제가 만들어져요.
                  </p>
                ) : null}
                <Checkbox
                  checked={notesPublic}
                  onChange={(e) => setNotesPublic(e.target.checked)}
                  label="배틀 후 상대에게 내 노트 공개에 동의해요."
                />
                {create.isError && <BattleErrorNotice error={create.error} courseId={courseId} />}
                <div>
                  <Button type="submit" loading={create.isPending} disabled={!canCreate}>
                    배틀 방 만들기
                  </Button>
                </div>
              </form>
            )}
          </Card>

          <Card as="section" aria-labelledby="join-battle-title">
            <h2 id="join-battle-title" className="mb-5 text-18 text-ink">
              방 코드로 입장
            </h2>
            <form className="flex flex-col gap-5" onSubmit={submitJoin}>
              <TextInput
                label="방 코드"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="예: K7M4QX"
                maxLength={12}
                autoComplete="off"
                disabled={join.isPending}
              />
              <Checkbox
                checked={joinNotesPublic}
                onChange={(e) => setJoinNotesPublic(e.target.checked)}
                label="배틀 후 상대에게 내 노트 공개에 동의해요."
              />
              {join.isError && <BattleErrorNotice error={join.error} courseId={courseId} />}
              <div>
                <Button
                  type="submit"
                  variant="secondary"
                  loading={join.isPending}
                  disabled={!normalizeRoomCode(code)}
                >
                  입장하기
                </Button>
              </div>
              <p className="text-10 text-subtle">
                친구가 보내 준 링크를 열어도 바로 입장돼요. 두 사람이 모두 동의해야 서로의 노트가
                보여요.
              </p>
            </form>
          </Card>
        </div>
      )}
    </>
  )
}
