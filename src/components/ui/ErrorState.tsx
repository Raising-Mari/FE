import { getErrorMessage, isNetworkError } from '@/api/errorMessages'
import { Button } from './Button'
import { StateBox } from './StateBox'

interface ErrorStateProps {
  /** `useQuery`·`useMutation`이 돌려준 오류. 안내문은 `ApiError.code`로 만든다. */
  error: unknown
  /** 주면 "다시 시도" 버튼을 보여 준다. 보통 `refetch`. */
  onRetry?: () => void
  className?: string
}

/** 서버 요청이 실패했을 때 쓰는 `StateBox`. 서버에 닿지 못한 경우는 제목을 따로 쓴다(시안 29). */
export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  return (
    <StateBox
      kind="error"
      className={className}
      title={isNetworkError(error) ? '서버에 연결할 수 없어요' : undefined}
      message={getErrorMessage(error)}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            다시 시도
          </Button>
        )
      }
    />
  )
}
