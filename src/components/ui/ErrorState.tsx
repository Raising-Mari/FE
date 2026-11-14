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

const NETWORK_MESSAGE =
  '인터넷 연결을 확인하고 다시 시도해 주세요.\n계속되면 잠시 뒤에 다시 와 주세요.'

/**
 * 서버 요청이 실패했을 때 쓰는 `StateBox`. 서버에 닿지 못한 경우는 제목과 문구를 따로 쓴다(시안 29).
 * 제목이 이미 "연결할 수 없어요"라서 `getErrorMessage`의 같은 문장을 되풀이하지 않는다.
 */
export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  const network = isNetworkError(error)
  return (
    <StateBox
      kind="error"
      className={className}
      title={network ? '서버에 연결할 수 없어요' : undefined}
      message={network ? NETWORK_MESSAGE : getErrorMessage(error)}
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
