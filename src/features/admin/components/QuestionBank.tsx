import { useState } from 'react'
import { getErrorMessage } from '@/api/errorMessages'
import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Pager } from '@/components/ui/Pager'
import { Pill } from '@/components/ui/Pill'
import { Select } from '@/components/ui/Select'
import { StateBox } from '@/components/ui/StateBox'
import type { Unit } from '@/hooks/useCourseQueries'
import { QUESTION_STATUS_LABEL, type QuestionStatus } from '../api'
import { useQuestionJob, useQuestions, useStartQuestionJob } from '../hooks/useAdmin'
import { ManualQuestionDialog, QuestionDetailDialog } from './QuestionDialogs'

const JOB_STATUS = {
  QUEUED: '대기 중',
  RUNNING: '만드는 중',
  DONE: '끝남',
  FAILED: '실패',
} as const
const STATUSES = Object.keys(QUESTION_STATUS_LABEL) as QuestionStatus[]

/** 문제 은행(시안 25): 문항 목록·상세·상태 변경, 직접 추가, 생성 작업 실행. `units` 는 지금 고른 과목의 주차다. */
export function QuestionBank({ units }: { units: Unit[] }) {
  const [unitId, setUnitId] = useState('')
  const [status, setStatus] = useState<QuestionStatus | ''>('')
  const [page, setPage] = useState(0)
  const [detail, setDetail] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [jobId, setJobId] = useState<number | null>(null)
  const questions = useQuestions({
    unitId: unitId ? Number(unitId) : undefined,
    status: status || undefined,
    page,
  })
  const start = useStartQuestionJob()
  const job = useQuestionJob(jobId)
  const unitTitle = (id?: number) => units.find((u) => u.id === id)?.title ?? `주차 #${id}`

  return (
    <Card as="section" aria-labelledby="bank-title" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 id="bank-title" className="text-18 text-ink">
          문제 은행
        </h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={!unitId || start.isPending}
            loading={start.isPending}
            onClick={() =>
              start.mutate(
                { unitId: Number(unitId), targetCount: 10 },
                {
                  onSuccess: (created) => setJobId(created.jobId ?? null),
                },
              )
            }
          >
            이 주차 문제 만들기
          </Button>
          <Button disabled={units.length === 0} onClick={() => setAdding(true)}>
            문제 직접 추가
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="주차"
          value={unitId}
          onChange={(e) => {
            setUnitId(e.target.value)
            setPage(0)
          }}
          hint={
            units.length === 0 ? '왼쪽 메뉴에서 과목을 고르면 주차로 거를 수 있어요.' : undefined
          }
        >
          <option value="">전체 주차</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.title}
            </option>
          ))}
        </Select>
        <Select
          label="상태"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as QuestionStatus | '')
            setPage(0)
          }}
        >
          <option value="">전체 상태</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {QUESTION_STATUS_LABEL[value]}
            </option>
          ))}
        </Select>
      </div>

      {start.isError && (
        <p role="alert" className="text-12 text-danger">
          {start.error instanceof ApiError && start.error.status === 409
            ? '이 주차에는 이미 대기·실행 중인 작업이 있어요.'
            : getErrorMessage(start.error)}
        </p>
      )}
      {jobId !== null && job.data && (
        <p role="status" className="rounded-md bg-surface-muted px-3 py-2 text-11 text-ink">
          문제 만들기 작업 {job.data.status ? JOB_STATUS[job.data.status] : ''} · 만든 후보{' '}
          {job.data.generatedCount ?? 0}개 · 통과 {job.data.passedCount ?? 0}개 · 탈락{' '}
          {job.data.rejectedCount ?? 0}개{job.data.failReason && ` · 이유: ${job.data.failReason}`}
        </p>
      )}

      {questions.isPending ? (
        <StateBox kind="loading" className="border-0" />
      ) : questions.isError ? (
        <ErrorState
          error={questions.error}
          onRetry={() => void questions.refetch()}
          className="border-0"
        />
      ) : (questions.data.items ?? []).length === 0 ? (
        <StateBox
          kind="empty"
          className="border-0"
          title="조건에 맞는 문제가 없어요"
          message="자료를 주차에 연결하거나 문제를 직접 추가해 보세요."
        />
      ) : (
        <ul aria-label="문항" className="flex flex-col">
          {questions.data.items!.map((question) => (
            <li
              key={question.id}
              className="flex items-center justify-between gap-3 border-b border-line-soft py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-12 text-ink">{question.stem}</p>
                <p className="text-10 text-subtle">
                  {unitTitle(question.unitId)} · {question.source === 'MANUAL' ? '직접 추가' : 'AI'}{' '}
                  ·{' '}
                  {question.correctRate == null
                    ? '아직 사용 전'
                    : `정답률 ${Math.round(question.correctRate * 100)}% (${question.answeredCount ?? 0}회)`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Pill>{question.status ? QUESTION_STATUS_LABEL[question.status] : '—'}</Pill>
                <Button
                  variant="link"
                  aria-label={`${question.stem} 상세`}
                  onClick={() => setDetail(question.id ?? null)}
                >
                  상세
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pager
        page={page}
        hasNext={questions.data?.hasNext ?? false}
        onChange={setPage}
        disabled={questions.isFetching}
      />

      {detail !== null && (
        <QuestionDetailDialog questionId={detail} onClose={() => setDetail(null)} />
      )}
      {adding && <ManualQuestionDialog units={units} onClose={() => setAdding(false)} />}
    </Card>
  )
}
