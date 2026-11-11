import { StateBox } from '@/components/ui/StateBox'
import { ButtonLink } from '@/components/ui/ButtonLink'

/** 권한이 없는 화면을 열었을 때(시안 30). 관리자 화면에 학생이 들어오면 가드가 본문 자리에 이것을 보여 준다. */
export function ForbiddenPage() {
  return (
    <StateBox
      kind="error"
      title="관리자만 볼 수 있는 화면이에요"
      message="이 화면을 볼 권한이 없어요. 학생 화면으로 돌아가 주세요."
      action={
        <ButtonLink to="/courses" variant="secondary">
          내 과목으로
        </ButtonLink>
      }
    />
  )
}
