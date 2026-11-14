import { useState } from 'react'
import { getErrorMessage } from '@/api/errorMessages'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog } from '@/components/ui/Dialog'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pager } from '@/components/ui/Pager'
import { Pill } from '@/components/ui/Pill'
import { Select } from '@/components/ui/Select'
import { StateBox } from '@/components/ui/StateBox'
import { Textarea } from '@/components/ui/Textarea'
import { formatKst } from '@/lib/datetime'
import { toast } from '@/stores/toastStore'
import {
  REPORT_REASON_LABEL,
  REPORT_STATUS_LABEL,
  type AdminReport,
  type HandleReportInput,
  type ReportStatus,
} from '../api'
import { useHandleReport, useReports } from '../hooks/useAdmin'

/** 처리 상태로 `OPEN` 은 서버가 받지 않는다(X-08). */
const HANDLE_STATUSES: HandleReportInput['status'][] = ['REVIEWING', 'ACCEPTED', 'REJECTED']

function HandleDialog({ report, onClose }: { report: AdminReport; onClose: () => void }) {
  const handle = useHandleReport()
  const [status, setStatus] = useState<HandleReportInput['status']>('ACCEPTED')
  const [note, setNote] = useState(report.resolutionNote ?? '')
  const [action, setAction] = useState<NonNullable<HandleReportInput['questionAction']>>('NONE')
  const [failure, setFailure] = useState<string | null>(null)

  function submit() {
    if (!report.id) return
    setFailure(null)
    handle.mutate(
      {
        reportId: report.id,
        body: { status, resolutionNote: note.trim() || undefined, questionAction: action },
      },
      {
        onSuccess: () => {
          toast.info('신고를 처리했어요.')
          onClose()
        },
        onError: (error) => setFailure(getErrorMessage(error)),
      },
    )
  }

  return (
    <Dialog
      open
      title="신고 처리"
      onClose={onClose}
      dismissible={!handle.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={handle.isPending}>
            취소
          </Button>
          <Button onClick={submit} loading={handle.isPending}>
            처리
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-12 text-ink">{report.questionStem}</p>
        {report.detail && <p className="text-11 text-muted">“{report.detail}”</p>}
        <Select
          label="처리 결과"
          value={status}
          onChange={(e) => setStatus(e.target.value as HandleReportInput['status'])}
        >
          {HANDLE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {REPORT_STATUS_LABEL[value]}
            </option>
          ))}
        </Select>
        <Select
          label="문항 조치"
          value={action}
          onChange={(e) => setAction(e.target.value as typeof action)}
        >
          <option value="NONE">그대로 둠</option>
          <option value="RETIRE">사용 중지</option>
          <option value="RESTORE">검수 통과로 되돌림</option>
        </Select>
        <Textarea
          label="처리 메모"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={1000}
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

/** 신고·이의제기(X-07·X-08). 기본은 아직 처리하지 않은 것만 본다. */
export function ReportsPanel() {
  const [status, setStatus] = useState<ReportStatus | ''>('OPEN')
  const [page, setPage] = useState(0)
  const [target, setTarget] = useState<AdminReport | null>(null)
  const reports = useReports(status || null, page)

  return (
    <Card as="section" aria-labelledby="reports-title" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <h2 id="reports-title" className="text-18 text-ink">
          신고·이의제기
        </h2>
        <Select
          label="상태"
          className="w-[180px]"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ReportStatus | '')
            setPage(0)
          }}
        >
          <option value="">전체</option>
          {(Object.keys(REPORT_STATUS_LABEL) as ReportStatus[]).map((value) => (
            <option key={value} value={value}>
              {REPORT_STATUS_LABEL[value]}
            </option>
          ))}
        </Select>
      </div>
      {reports.isPending ? (
        <StateBox kind="loading" className="border-0" />
      ) : reports.isError ? (
        <ErrorState
          error={reports.error}
          onRetry={() => void reports.refetch()}
          className="border-0"
        />
      ) : (reports.data.items ?? []).length === 0 ? (
        <p className="py-3 text-12 text-muted">접수된 신고가 없어요.</p>
      ) : (
        <ul aria-label="신고" className="flex flex-col">
          {reports.data.items!.map((report) => (
            <li
              key={report.id}
              className="flex items-center justify-between gap-3 border-b border-line-soft py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-12 text-ink">{report.questionStem}</p>
                <p className="text-10 text-subtle">
                  {report.kind === 'GRADING' ? '채점 이의' : '문제 신고'} ·{' '}
                  {report.reasonType ? REPORT_REASON_LABEL[report.reasonType] : '—'} ·{' '}
                  {formatKst(report.createdAt)}
                  {report.detail && ` · “${report.detail}”`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Pill>{report.status ? REPORT_STATUS_LABEL[report.status] : '—'}</Pill>
                <Button variant="secondary" onClick={() => setTarget(report)}>
                  처리
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pager
        page={page}
        hasNext={reports.data?.hasNext ?? false}
        onChange={setPage}
        disabled={reports.isFetching}
      />
      {target && <HandleDialog report={target} onClose={() => setTarget(null)} />}
    </Card>
  )
}
