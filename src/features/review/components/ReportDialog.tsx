import { useState } from 'react'
import { getErrorMessage } from '@/api/errorMessages'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from '@/stores/toastStore'
import { REPORT_REASONS, type ReportKind, type ReportReason } from '../api'
import { useReport } from '../hooks/useReview'

interface ReportDialogProps {
  answerId: number
  stem: string
  /** 채점 조작 의심으로 0점이 된 답은 채점 이의제기부터 보여 준다. */
  defaultKind?: ReportKind
  onClose: () => void
}

/** 문제·채점 신고(시안 21). 문제 신고는 그 문제를 바로 배틀에서 빼고, 채점 이의제기는 운영자가 다시 본다. */
export function ReportDialog({
  answerId,
  stem,
  defaultKind = 'QUESTION',
  onClose,
}: ReportDialogProps) {
  const [kind, setKind] = useState<ReportKind>(defaultKind)
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[defaultKind][0]!.value)
  const [detail, setDetail] = useState('')
  const [failure, setFailure] = useState<string | null>(null)
  const report = useReport()

  function changeKind(next: ReportKind) {
    setKind(next)
    setReason(REPORT_REASONS[next][0]!.value)
  }

  function submit() {
    setFailure(null)
    report.mutate(
      { answerId, report: { kind, reasonType: reason, detail: detail.trim() || undefined } },
      {
        onSuccess: () => {
          toast.info('신고를 접수했어요. 확인한 뒤 반영할게요.')
          onClose()
        },
        onError: (error) => setFailure(getErrorMessage(error)),
      },
    )
  }

  return (
    <Dialog
      open
      title="문제·채점 신고"
      onClose={onClose}
      dismissible={!report.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={report.isPending}>
            취소
          </Button>
          <Button onClick={submit} loading={report.isPending}>
            확인
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-12 text-ink">{stem}</p>
        <Select
          label="무엇이 이상한가요?"
          value={kind}
          onChange={(e) => changeKind(e.target.value as ReportKind)}
          disabled={report.isPending}
        >
          <option value="QUESTION">문제가 이상해요</option>
          <option value="GRADING">채점이 이상해요</option>
        </Select>
        <Select
          label="이유"
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportReason)}
          disabled={report.isPending}
        >
          {REPORT_REASONS[kind].map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
        <Textarea
          label="신고 내용"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="어떤 점이 이상했는지 적어 주세요. (선택)"
          disabled={report.isPending}
        />
        {failure && (
          <p role="alert" className="text-12 text-danger">
            {failure}
          </p>
        )}
      </div>
    </Dialog>
  )
}
