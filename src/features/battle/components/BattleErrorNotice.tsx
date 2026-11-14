import { getErrorMessage } from '@/api/errorMessages'
import { ApiError } from '@/api/errors'
import { ButtonLink } from '@/components/ui/ButtonLink'

interface BattleErrorNoticeProps {
  error: unknown
  /** 오류 본문에 과목이 없을 때 쓸 과목(방 만들기 화면의 과목). */
  courseId?: number
}

function readDetails(error: unknown) {
  if (!(error instanceof ApiError)) return {}
  const { courseId, unit } = error.details as {
    courseId?: unknown
    unit?: { id?: unknown; title?: unknown }
  }
  return {
    courseId: typeof courseId === 'number' ? courseId : undefined,
    unitId: typeof unit?.id === 'number' ? unit.id : undefined,
    unitTitle: typeof unit?.title === 'string' ? unit.title : undefined,
  }
}

/**
 * 방 만들기·입장·준비가 거절됐을 때의 안내. 다음에 할 일이 분명한 오류(노트 없음·제자 없음)는 그 화면으로 가는 버튼을 붙인다.
 */
export function BattleErrorNotice({ error, courseId }: BattleErrorNoticeProps) {
  const code = error instanceof ApiError ? error.code : ''
  const details = readDetails(error)
  const course = details.courseId ?? courseId

  let message = getErrorMessage(error)
  let action = null
  if (code === 'BATTLE_NOTES_REQUIRED' && course) {
    if (details.unitTitle)
      message = `‘${details.unitTitle}’에 내 노트가 없어요. 먼저 마리를 가르쳐 주세요.`
    action = (
      <ButtonLink
        variant="secondary"
        to={`/courses/${course}/teach${details.unitId ? `?unitId=${details.unitId}` : ''}`}
      >
        가르치러 가기
      </ButtonLink>
    )
  } else if (code === 'BATTLE_DISCIPLE_REQUIRED' && course) {
    action = (
      <ButtonLink variant="secondary" to={`/courses/${course}`}>
        제자 만들러 가기
      </ButtonLink>
    )
  }

  return (
    <div role="alert" className="flex flex-col items-start gap-2">
      <p className="text-12 text-danger">{message}</p>
      {action}
    </div>
  )
}
