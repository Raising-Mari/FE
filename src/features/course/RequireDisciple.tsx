import { Outlet, useParams } from 'react-router'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { ErrorState } from '@/components/ui/ErrorState'
import { StateBox } from '@/components/ui/StateBox'
import { useDisciple } from './hooks/useCourses'

export function RequireDisciple() {
  const id = Number(useParams().courseId)
  const disciple = useDisciple(id)
  if (!Number.isSafeInteger(id) || id <= 0)
    return <StateBox kind="error" title="과목 주소를 확인해주세요" />
  if (disciple.isPending) return <StateBox kind="loading" />
  if (disciple.isError)
    return <ErrorState error={disciple.error} onRetry={() => void disciple.refetch()} />
  if (!disciple.data)
    return (
      <StateBox
        kind="empty"
        title="제자를 먼저 만들어주세요"
        message="이 과목에 제자가 있어야 가르치기와 배틀을 시작할 수 있어요."
        action={<ButtonLink to={`/courses/${id}`}>제자 만들러 가기</ButtonLink>}
      />
    )
  return <Outlet />
}
