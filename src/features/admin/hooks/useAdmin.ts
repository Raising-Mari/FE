import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStatusPolling } from '@/hooks/useStatusPolling'
import {
  changeQuestionStatus,
  createQuestion,
  fetchAiCalls,
  fetchQuestion,
  fetchQuestionAccuracy,
  fetchQuestionJob,
  fetchQuestions,
  fetchReports,
  fetchUsage,
  handleReport,
  startQuestionJob,
  type HandleReportInput,
  type QuestionJob,
  type QuestionStatus,
  type ReportStatus,
} from '../api'

const keys = {
  questions: ['admin', 'questions'] as const,
  reports: ['admin', 'reports'] as const,
  stats: ['admin', 'stats'] as const,
}

export function useQuestions(params: { unitId?: number; status?: QuestionStatus; page: number }) {
  return useQuery({
    queryKey: [...keys.questions, 'list', params],
    queryFn: () => fetchQuestions(params),
    placeholderData: keepPreviousData,
  })
}

export function useQuestion(questionId: number) {
  return useQuery({
    queryKey: [...keys.questions, 'detail', questionId],
    queryFn: () => fetchQuestion(questionId),
    enabled: questionId > 0,
  })
}

/** 문항이 바뀌면 목록·상세·정답률 통계를 모두 다시 받는다. */
function useInvalidateQuestions() {
  const client = useQueryClient()
  return () => {
    void client.invalidateQueries({ queryKey: keys.questions })
    void client.invalidateQueries({ queryKey: keys.stats })
  }
}

export function useChangeQuestionStatus() {
  const invalidate = useInvalidateQuestions()
  return useMutation({
    mutationFn: (input: { questionId: number; status: QuestionStatus }) =>
      changeQuestionStatus(input.questionId, input.status),
    onSuccess: invalidate,
  })
}

export function useCreateQuestion() {
  const invalidate = useInvalidateQuestions()
  return useMutation({ mutationFn: createQuestion, onSuccess: invalidate })
}

export function useStartQuestionJob() {
  return useMutation({
    mutationFn: (input: { unitId: number; targetCount: number }) =>
      startQuestionJob(input.unitId, input.targetCount),
  })
}

const jobDone = (job: QuestionJob) => job.status === 'DONE' || job.status === 'FAILED'

/** 작업이 끝날 때까지 2.5초마다 진행 상황을 받는다. */
export function useQuestionJob(jobId: number | null) {
  return useStatusPolling<QuestionJob>({
    queryKey: [...keys.questions, 'job', jobId],
    queryFn: () => fetchQuestionJob(jobId ?? 0),
    isDone: jobDone,
    enabled: jobId !== null,
  })
}

export function useReports(status: ReportStatus | null, page: number) {
  return useQuery({
    queryKey: [...keys.reports, status, page],
    queryFn: () => fetchReports(status, page),
    placeholderData: keepPreviousData,
  })
}

export function useHandleReport() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { reportId: number; body: HandleReportInput }) =>
      handleReport(input.reportId, input.body),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.reports })
      // 신고 처리로 문항을 중지·복구했을 수 있다.
      void client.invalidateQueries({ queryKey: keys.questions })
    },
  })
}

export function useUsage() {
  return useQuery({ queryKey: [...keys.stats, 'usage'], queryFn: fetchUsage })
}

export function useAiCalls() {
  return useQuery({ queryKey: [...keys.stats, 'ai-calls'], queryFn: fetchAiCalls })
}

export function useQuestionAccuracy() {
  return useQuery({ queryKey: [...keys.stats, 'accuracy'], queryFn: fetchQuestionAccuracy })
}
