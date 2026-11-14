import { apiClient } from '@/api/client'
import type { components } from '@/api/generated/schema'
import type { QuestionAccuracyResponse } from '@/api/overrides'

type Schemas = components['schemas']
export type QuestionSummary = Schemas['AdminQuestionSummary']
export type QuestionDetail = Schemas['AdminQuestionDetail']
export type QuestionStatus = NonNullable<QuestionSummary['status']>
export type QuestionJob = Schemas['AdminQuestionJobResponse']
export type ManualQuestionInput = Schemas['CreateManualQuestionRequest']
export type AdminReport = Schemas['AdminReportResponse']
export type ReportStatus = NonNullable<AdminReport['status']>
export type HandleReportInput = Schemas['HandleReportRequest']
export type UsageStats = Schemas['UsageStatsResponse']
export type AiCallStats = Schemas['AiCallStatsResponse']
export type { QuestionAccuracyResponse } from '@/api/overrides'

export const PAGE_SIZE = 10
export const STATS_DAYS = 7

export const QUESTION_STATUS_LABEL: Record<QuestionStatus, string> = {
  VERIFIED: '검수 통과',
  UNJUDGED: '미판정',
  UNDER_REVIEW: '검토 중',
  RETIRED: '사용 중지',
}

/** X-05 가 받아 주는 상태 변경. `UNJUDGED` 로 되돌리거나 `UNJUDGED → UNDER_REVIEW` 는 서버가 409 로 막는다. */
export const NEXT_STATUSES: Record<QuestionStatus, QuestionStatus[]> = {
  UNJUDGED: ['VERIFIED', 'RETIRED'],
  VERIFIED: ['UNDER_REVIEW', 'RETIRED'],
  UNDER_REVIEW: ['VERIFIED', 'RETIRED'],
  RETIRED: ['VERIFIED', 'UNDER_REVIEW'],
}

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  OPEN: '접수',
  REVIEWING: '검토 중',
  ACCEPTED: '받아들임',
  REJECTED: '반려',
}

export const REPORT_REASON_LABEL: Record<NonNullable<AdminReport['reasonType']>, string> = {
  WRONG_ANSWER: '정답이 틀림',
  AMBIGUOUS: '문제가 모호함',
  NOT_IN_MATERIAL: '자료에 없는 내용',
  GRADING_DISPUTE: '채점 이의',
  OTHER: '기타',
}

/** X-03 문항 목록(최신순). */
export async function fetchQuestions(params: {
  unitId?: number
  status?: QuestionStatus
  page: number
}) {
  const { data } = await apiClient.get<Schemas['PageResponseAdminQuestionSummary']>(
    '/api/admin/questions',
    { params: { ...params, size: PAGE_SIZE } },
  )
  return data
}

/** X-04 문항 상세와 검증 기록. */
export async function fetchQuestion(questionId: number) {
  const { data } = await apiClient.get<QuestionDetail>(`/api/admin/questions/${questionId}`)
  return data
}

/** X-05 문항 상태 변경. */
export async function changeQuestionStatus(questionId: number, status: QuestionStatus) {
  const { data } = await apiClient.patch<QuestionDetail>(
    `/api/admin/questions/${questionId}/status`,
    { status } satisfies Schemas['ChangeQuestionStatusRequest'],
  )
  return data
}

/** X-06 문항 직접 추가. 바로 검수 통과로 저장된다. */
export async function createQuestion(input: ManualQuestionInput) {
  const { data } = await apiClient.post<QuestionDetail>('/api/admin/questions', input)
  return data
}

/** X-01 문항 생성 작업 실행. 같은 주차에 대기·실행 중인 작업이 있으면 409. */
export async function startQuestionJob(unitId: number, targetCount: number) {
  const { data } = await apiClient.post<Schemas['CreateQuestionJobResponse']>(
    `/api/admin/units/${unitId}/question-jobs`,
    { targetCount } satisfies Schemas['CreateQuestionJobRequest'],
  )
  return data
}

/** X-02 작업 진행과 단계별 탈락 수. */
export async function fetchQuestionJob(jobId: number) {
  const { data } = await apiClient.get<QuestionJob>(`/api/admin/question-jobs/${jobId}`)
  return data
}

/** X-07 신고·이의제기 목록. */
export async function fetchReports(status: ReportStatus | null, page: number) {
  const { data } = await apiClient.get<Schemas['PageResponseAdminReportResponse']>(
    '/api/admin/reports',
    { params: { status: status ?? undefined, page, size: PAGE_SIZE } },
  )
  return data
}

/** X-08 신고 처리. */
export async function handleReport(reportId: number, input: HandleReportInput) {
  const { data } = await apiClient.patch<AdminReport>(`/api/admin/reports/${reportId}`, input)
  return data
}

/** X-11 시험 사용 지표. */
export async function fetchUsage() {
  const { data } = await apiClient.get<UsageStats>('/api/admin/stats/usage', {
    params: { days: STATS_DAYS },
  })
  return data
}

/** X-10 일별 AI 호출 수. */
export async function fetchAiCalls() {
  const { data } = await apiClient.get<AiCallStats>('/api/admin/stats/ai-calls', {
    params: { days: STATS_DAYS },
  })
  return data
}

/** X-09 정답률이 0%·100%에 가까운 문항. */
export async function fetchQuestionAccuracy() {
  const { data } = await apiClient.get<QuestionAccuracyResponse>('/api/admin/stats/questions')
  return data
}

/** X-12 채점 일치도 비교용 CSV. 개인을 알아볼 수 있는 값은 들어 있지 않다. */
export async function downloadBattleAnswersCsv(): Promise<Blob> {
  const { data } = await apiClient.get<Blob>('/api/admin/exports/battle-answers.csv', {
    responseType: 'blob',
  })
  return data
}
