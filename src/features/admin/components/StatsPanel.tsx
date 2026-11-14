import { useMutation } from '@tanstack/react-query'
import { getErrorMessage } from '@/api/errorMessages'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { StateBox } from '@/components/ui/StateBox'
import { toast } from '@/stores/toastStore'
import { downloadBattleAnswersCsv, STATS_DAYS } from '../api'
import { useAiCalls, useQuestionAccuracy, useUsage } from '../hooks/useAdmin'

function Stat({ label, value }: { label: string; value: number | string | undefined }) {
  return (
    <div className="rounded-md bg-surface-muted px-3 py-2">
      <dt className="text-10 text-subtle">{label}</dt>
      <dd className="text-18 text-navy">{value ?? 0}</dd>
    </div>
  )
}

/** 받은 파일을 브라우저의 내려받기로 넘긴다. */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/** 사용 통계(X-09~X-12): 시험 사용 지표, AI 호출 수, 너무 어렵거나 쉬운 문항, 채점 비교용 CSV. */
export function StatsPanel() {
  const usage = useUsage()
  const aiCalls = useAiCalls()
  const accuracy = useQuestionAccuracy()
  const exportCsv = useMutation({
    mutationFn: downloadBattleAnswersCsv,
    onSuccess: (blob) => saveBlob(blob, 'battle-answers.csv'),
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <Card as="section" aria-labelledby="stats-title" className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 id="stats-title" className="text-18 text-ink">
          사용 통계 · 최근 {STATS_DAYS}일
        </h2>
        <Button
          variant="secondary"
          loading={exportCsv.isPending}
          onClick={() => exportCsv.mutate()}
        >
          채점 기록 CSV 내보내기
        </Button>
      </div>

      {usage.isPending ? (
        <StateBox kind="loading" className="border-0" />
      ) : usage.isError ? (
        <ErrorState error={usage.error} onRetry={() => void usage.refetch()} className="border-0" />
      ) : (
        <dl className="grid grid-cols-4 gap-3">
          <Stat label="활동한 학생" value={usage.data.activeStudents} />
          <Stat label="다시 온 학생" value={usage.data.returningStudents} />
          <Stat label="가르치기 메시지" value={usage.data.studentMessages} />
          <Stat label="끝난 랭킹 배틀" value={usage.data.rankedBattlesFinished} />
          <Stat label="끝난 연습 배틀" value={usage.data.practiceBattlesFinished} />
          <Stat
            label="연습에서 고쳐 맞힌 답"
            value={`${usage.data.practiceRetest?.improvedFromWrong ?? 0} / ${usage.data.practiceRetest?.answered ?? 0}`}
          />
          <Stat
            label="복기 (원인 제안과 다름)"
            value={`${usage.data.reviews?.written ?? 0} (${usage.data.reviews?.causeDisagreed ?? 0})`}
          />
          <Stat
            label="신고 (문제 / 채점)"
            value={`${usage.data.reports?.question ?? 0} / ${usage.data.reports?.grading ?? 0}`}
          />
        </dl>
      )}

      <div>
        <h3 className="mb-2 text-14 text-ink">AI 호출</h3>
        {aiCalls.isPending ? (
          <StateBox kind="loading" className="border-0" />
        ) : aiCalls.isError ? (
          <ErrorState
            error={aiCalls.error}
            onRetry={() => void aiCalls.refetch()}
            className="border-0"
          />
        ) : (
          <table className="w-full text-left text-11 text-ink">
            <caption className="sr-only">일별 AI 호출 수</caption>
            <thead className="text-subtle">
              <tr>
                <th scope="col" className="py-1">
                  날짜
                </th>
                <th scope="col">호출</th>
                <th scope="col">실패</th>
                <th scope="col">입력 토큰</th>
                <th scope="col">출력 토큰</th>
              </tr>
            </thead>
            <tbody>
              {(aiCalls.data.days ?? []).map((day) => (
                <tr key={day.date} className="border-t border-line-soft">
                  <th scope="row" className="py-1 font-normal">
                    {day.date}
                  </th>
                  <td>{day.total ?? 0}</td>
                  <td>{day.failed ?? 0}</td>
                  <td>{day.inputTokens ?? 0}</td>
                  <td>{day.outputTokens ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-1 text-10 text-subtle">
          날짜는 한국 시간 기준이에요. 무료 한도는 한국 시간 오후 4~5시에 초기화돼요.
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-14 text-ink">살펴볼 문항</h3>
        {accuracy.isPending ? (
          <StateBox kind="loading" className="border-0" />
        ) : accuracy.isError ? (
          <ErrorState
            error={accuracy.error}
            onRetry={() => void accuracy.refetch()}
            className="border-0"
          />
        ) : accuracy.data.tooHard.length + accuracy.data.tooEasy.length === 0 ? (
          <p className="text-12 text-muted">
            답이 {accuracy.data.minAnswers}개 이상 쌓인 문항 중 너무 어렵거나 쉬운 것이 없어요.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 text-11 text-ink">
            {[
              ...accuracy.data.tooHard.map((q) => ({ ...q, tag: '너무 어려움' })),
              ...accuracy.data.tooEasy.map((q) => ({ ...q, tag: '너무 쉬움' })),
            ].map((q) => (
              <li key={`${q.tag}-${q.questionId}`} className="flex justify-between gap-3">
                <span className="truncate">{q.stem}</span>
                <span className="shrink-0 text-muted">
                  {q.tag} · 정답률 {Math.round(q.correctRate * 100)}% ({q.answeredCount}회)
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
