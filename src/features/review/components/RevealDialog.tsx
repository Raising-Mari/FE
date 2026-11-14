import { getErrorMessage } from '@/api/errorMessages'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { toast } from '@/stores/toastStore'
import { useRevealAnswers } from '../hooks/useReview'

interface RevealDialogProps {
  /** 정답을 열 랭킹 배틀. 연습 결과에서는 원본 배틀이다. */
  battleId: number
  onClose: () => void
  onRevealed?: () => void
}

/** 정답 보기 확인 창. 되돌릴 수 없고 이 배틀의 연습이 끝난다는 것을 먼저 알린다. */
export function RevealDialog({ battleId, onClose, onRevealed }: RevealDialogProps) {
  const reveal = useRevealAnswers(battleId)

  function confirm() {
    reveal.mutate(undefined, {
      onSuccess: () => {
        onClose()
        onRevealed?.()
      },
      onError: (error) => {
        toast.error(getErrorMessage(error))
        onClose()
      },
    })
  }

  return (
    <Dialog
      open
      title="정답 보기"
      onClose={onClose}
      dismissible={!reveal.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={reveal.isPending}>
            아직 안 볼래요
          </Button>
          <Button onClick={confirm} loading={reveal.isPending}>
            정답 보기
          </Button>
        </>
      }
    >
      <p className="text-12 text-ink">모범 답과 자료 근거를 열어요. 한 번 열면 되돌릴 수 없어요.</p>
      <p className="mt-2 text-11 text-subtle">
        정답을 보면 이 배틀의 문제로는 더 연습할 수 없어요. 노트를 고쳐 다시 풀어보고 싶다면 먼저
        연습해 보세요.
      </p>
    </Dialog>
  )
}
