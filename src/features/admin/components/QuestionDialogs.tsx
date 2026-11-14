import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '@/api/errorMessages'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ErrorState } from '@/components/ui/ErrorState'
import { Select } from '@/components/ui/Select'
import { StateBox } from '@/components/ui/StateBox'
import { TextInput } from '@/components/ui/TextInput'
import { Textarea } from '@/components/ui/Textarea'
import type { Unit } from '@/hooks/useCourseQueries'
import { formatKst } from '@/lib/datetime'
import { toast } from '@/stores/toastStore'
import { NEXT_STATUSES, QUESTION_STATUS_LABEL, type ManualQuestionInput } from '../api'
import { useChangeQuestionStatus, useCreateQuestion, useQuestion } from '../hooks/useAdmin'

const STAGE_LABEL = {
  GENERATE: '생성',
  EVIDENCE_CHECK: '근거 확인',
  LEAK_TEST: '누출 시험',
  EXTERNAL_JUDGE: '외부 판정',
} as const

const lines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

/** 문항 상세(X-04)와 상태 변경(X-05). 정답·근거는 관리자에게만 보인다. */
export function QuestionDetailDialog({
  questionId,
  onClose,
}: {
  questionId: number
  onClose: () => void
}) {
  const question = useQuestion(questionId)
  const change = useChangeQuestionStatus()
  const data = question.data

  return (
    <Dialog open title="문항 상세" onClose={onClose} dismissible={!change.isPending}>
      {question.isPending ? (
        <StateBox kind="loading" className="border-0" />
      ) : question.isError || !data ? (
        <ErrorState
          error={question.error}
          onRetry={() => void question.refetch()}
          className="border-0"
        />
      ) : (
        <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto text-12 text-ink">
          <p className="text-14">{data.stem}</p>
          <dl className="grid grid-cols-[88px_1fr] gap-y-1.5">
            <dt className="text-muted">상태</dt>
            <dd>{data.status ? QUESTION_STATUS_LABEL[data.status] : '—'}</dd>
            <dt className="text-muted">만든 곳</dt>
            <dd>{data.source === 'MANUAL' ? '직접 추가' : 'AI 생성'}</dd>
            <dt className="text-muted">채점 방식</dt>
            <dd>{data.gradingMode === 'KEY_ELEMENTS' ? '핵심 요소' : '정답 목록'}</dd>
            {data.gradingMode === 'KEY_ELEMENTS' ? (
              <>
                <dt className="text-muted">핵심 요소</dt>
                <dd>
                  {(data.keyElements ?? [])
                    .map((e) => [e.label, ...(e.aliases ?? [])].join(' / '))
                    .join(', ')}{' '}
                  (필요 {data.requiredElements ?? '전부'})
                </dd>
              </>
            ) : (
              <>
                <dt className="text-muted">정답</dt>
                <dd>{(data.answers ?? []).join(', ')}</dd>
              </>
            )}
            <dt className="text-muted">모범 답</dt>
            <dd>{data.referenceAnswer}</dd>
            <dt className="text-muted">근거</dt>
            <dd>{data.evidenceText || '—'}</dd>
            <dt className="text-muted">사용</dt>
            <dd>
              {data.usedCount ?? 0}회 출제 ·{' '}
              {data.correctRate == null
                ? '아직 채점된 답 없음'
                : `정답률 ${Math.round(data.correctRate * 100)}% (${data.answeredCount ?? 0}회)`}
            </dd>
            <dt className="text-muted">검증 기록</dt>
            <dd>
              {(data.validationLogs ?? []).length === 0
                ? '없음'
                : data
                    .validationLogs!.map(
                      (log) =>
                        `${log.stage ? STAGE_LABEL[log.stage] : '?'} ${log.passed ? '통과' : '탈락'}`,
                    )
                    .join(' · ')}
            </dd>
            {data.reviewedAt && (
              <>
                <dt className="text-muted">검수</dt>
                <dd>{formatKst(data.reviewedAt)}</dd>
              </>
            )}
          </dl>
          {data.status && (
            <div className="flex flex-wrap gap-2 border-t border-line-soft pt-3">
              {NEXT_STATUSES[data.status].map((status) => (
                <Button
                  key={status}
                  variant="secondary"
                  disabled={change.isPending}
                  onClick={() =>
                    change.mutate(
                      { questionId, status },
                      {
                        onSuccess: () => toast.info('문항 상태를 바꿨어요.'),
                        onError: (error) => toast.error(getErrorMessage(error)),
                      },
                    )
                  }
                >
                  {QUESTION_STATUS_LABEL[status]}(으)로 바꾸기
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}

/** 문제 직접 추가(X-06). 사람이 만든 문항이라 바로 검수 통과로 저장된다. */
export function ManualQuestionDialog({ units, onClose }: { units: Unit[]; onClose: () => void }) {
  const create = useCreateQuestion()
  const [unitId, setUnitId] = useState(String(units[0]?.id ?? ''))
  const [stem, setStem] = useState('')
  const [mode, setMode] = useState<ManualQuestionInput['gradingMode']>('ANSWER_LIST')
  const [answers, setAnswers] = useState('')
  const [reference, setReference] = useState('')
  const [evidence, setEvidence] = useState('')
  const [failure, setFailure] = useState<string | null>(null)

  const items = lines(answers)
  const valid =
    !!unitId && !!stem.trim() && items.length > 0 && !!reference.trim() && !!evidence.trim()

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!valid || create.isPending) return
    setFailure(null)
    create.mutate(
      {
        unitId: Number(unitId),
        stem: stem.trim(),
        gradingMode: mode,
        referenceAnswer: reference.trim(),
        evidenceText: evidence.trim(),
        ...(mode === 'ANSWER_LIST'
          ? { answers: items }
          : {
              // "요소: 다른 표현1, 다른 표현2" 한 줄이 핵심 요소 하나다.
              keyElements: items.map((line) => {
                const [label = '', aliases = ''] = line.split(':')
                return {
                  label: label.trim(),
                  aliases: aliases
                    .split(',')
                    .map((a) => a.trim())
                    .filter(Boolean),
                }
              }),
            }),
      },
      {
        onSuccess: () => {
          toast.info('문제를 추가했어요.')
          onClose()
        },
        onError: (error) => setFailure(getErrorMessage(error)),
      },
    )
  }

  return (
    <Dialog open title="문제 직접 추가" onClose={onClose} dismissible={!create.isPending}>
      <form className="flex max-h-[460px] flex-col gap-3 overflow-y-auto" onSubmit={submit}>
        <Select label="주차" value={unitId} onChange={(e) => setUnitId(e.target.value)}>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.title}
            </option>
          ))}
        </Select>
        <TextInput
          label="문제"
          value={stem}
          onChange={(e) => setStem(e.target.value)}
          maxLength={500}
          required
        />
        <Select
          label="채점 방식"
          value={mode}
          onChange={(e) => setMode(e.target.value as ManualQuestionInput['gradingMode'])}
        >
          <option value="ANSWER_LIST">정답 목록 (하나라도 맞으면 정답)</option>
          <option value="KEY_ELEMENTS">핵심 요소 (요소를 모두 말해야 정답)</option>
        </Select>
        <Textarea
          label={mode === 'ANSWER_LIST' ? '정답 (한 줄에 하나)' : '핵심 요소 (한 줄에 하나)'}
          value={answers}
          onChange={(e) => setAnswers(e.target.value)}
          rows={3}
          hint={mode === 'KEY_ELEMENTS' ? '예: 후입선출: LIFO, 나중에 넣은 것이 먼저' : undefined}
          required
        />
        <Textarea
          label="모범 답"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          rows={2}
          required
        />
        <Textarea
          label="근거 문장"
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          rows={2}
          required
        />
        {failure && (
          <p role="alert" className="text-12 text-danger">
            {failure}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            취소
          </Button>
          <Button type="submit" loading={create.isPending} disabled={!valid}>
            문제 추가
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
