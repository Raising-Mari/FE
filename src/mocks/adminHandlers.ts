import { http, HttpResponse } from 'msw'
import type { components } from '@/api/generated/schema'
import type { QuestionAccuracyResponse } from '@/api/overrides'
import { useScenario } from './scenario'

type Schemas = components['schemas']
type Question = Schemas['AdminQuestionDetail']
type Report = Schemas['AdminReportResponse']

/** 관리자 화면 예시. 시안 25에 실린 시연 문항만 쓴다 — 실제 문제 은행의 문항·정답은 넣지 않는다. */
const SEED: [string, string][] = [
  ['스택은 어떤 순서로 데이터를 꺼내나요?', '후입선출'],
  ['큐는 어떤 순서로 데이터를 꺼내나요?', '선입선출'],
  ['스택에 데이터를 추가하는 연산은 무엇인가요?', 'push'],
  ['스택의 맨 위 데이터를 꺼내는 연산은 무엇인가요?', 'pop'],
  ['배열 스택이 가득 찼을 때 생길 수 있는 오류는?', 'overflow'],
]

export const mockQuestions: Question[] = []
export const mockReports: Report[] = []
const jobs = new Map<number, Schemas['AdminQuestionJobResponse'] & { polls: number }>()
let nextId = 1

export function resetAdminData() {
  nextId = 1
  jobs.clear()
  mockQuestions.splice(
    0,
    mockQuestions.length,
    ...SEED.map(([stem, answer], index) => ({
      id: nextId++,
      courseId: 1,
      unitId: 1,
      stem,
      gradingMode: 'ANSWER_LIST' as const,
      answers: [answer],
      referenceAnswer: answer,
      evidenceText: '스택과 큐 · 시연 공개 예문',
      status: 'UNJUDGED' as const,
      source: 'AI' as const,
      leakTestPassed: true,
      createdAt: '2026-11-07T10:00:00Z',
      usedCount: index === 4 ? 1 : 0,
      answeredCount: index === 4 ? 1 : 0,
      correctRate: index === 4 ? 0 : undefined,
      validationLogs: [{ stage: 'GENERATE' as const, passed: true }],
    })),
  )
  mockReports.splice(0, mockReports.length, {
    id: nextId++,
    kind: 'QUESTION',
    reasonType: 'AMBIGUOUS',
    detail: '답이 여러 개일 수 있어요',
    status: 'OPEN',
    questionId: 5,
    questionStem: '배열 스택이 가득 찼을 때 생길 수 있는 오류는?',
    battleAnswerId: 101,
    reporterId: 1,
    createdAt: '2026-11-07T12:00:00Z',
  })
}

const forbidden = () =>
  useScenario.getState().role === 'ADMIN'
    ? null
    : HttpResponse.json({ code: 'FORBIDDEN', message: '' }, { status: 403 })
const error = (status: number, code: string) => HttpResponse.json({ code, message: '' }, { status })

function paged<T>(all: T[], request: Request) {
  const query = new URL(request.url).searchParams
  const page = Number(query.get('page') ?? 0)
  const size = Number(query.get('size') ?? 20)
  return {
    items: all.slice(page * size, (page + 1) * size),
    page,
    size,
    totalElements: all.length,
    hasNext: all.length > (page + 1) * size,
  }
}

export const adminHandlers = [
  // 관리자가 아니면 모든 관리자 API 를 403 으로 막는다. 통과시키려면 아무것도 돌려주지 않는다.
  http.all('/api/admin/*', () => forbidden() ?? undefined),

  http.get('/api/admin/questions', ({ request }) => {
    const query = new URL(request.url).searchParams
    const all = mockQuestions
      .filter((q) => !query.get('unitId') || q.unitId === Number(query.get('unitId')))
      .filter((q) => !query.get('status') || q.status === query.get('status'))
      .sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
      .map(
        ({
          answers: _a,
          keyElements: _k,
          referenceAnswer: _r,
          evidenceText: _e,
          validationLogs: _v,
          ...q
        }) => q,
      )
    return HttpResponse.json(
      paged(all, request) satisfies Schemas['PageResponseAdminQuestionSummary'],
    )
  }),

  http.post('/api/admin/questions', async ({ request }) => {
    const input = (await request.json()) as Schemas['CreateManualQuestionRequest']
    if (input.gradingMode === 'ANSWER_LIST' ? !input.answers?.length : !input.keyElements?.length)
      return error(400, 'INVALID_INPUT')
    const question: Question = {
      ...input,
      id: nextId++,
      courseId: 1,
      status: 'VERIFIED',
      source: 'MANUAL',
      leakTestPassed: false,
      createdAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      usedCount: 0,
      answeredCount: 0,
      validationLogs: [],
    }
    mockQuestions.push(question)
    return HttpResponse.json(question, { status: 201 })
  }),

  http.get('/api/admin/questions/:questionId', ({ params }) => {
    const question = mockQuestions.find((q) => q.id === Number(params.questionId))
    return question ? HttpResponse.json(question) : error(404, 'NOT_FOUND')
  }),

  http.patch('/api/admin/questions/:questionId/status', async ({ request, params }) => {
    const question = mockQuestions.find((q) => q.id === Number(params.questionId))
    if (!question) return error(404, 'NOT_FOUND')
    const { status } = (await request.json()) as Schemas['ChangeQuestionStatusRequest']
    if (status === 'UNJUDGED' || (question.status === 'UNJUDGED' && status === 'UNDER_REVIEW'))
      return error(409, 'CONFLICT')
    question.status = status
    question.reviewedAt = new Date().toISOString()
    return HttpResponse.json(question)
  }),

  http.post('/api/admin/units/:unitId/question-jobs', ({ params }) => {
    const unitId = Number(params.unitId)
    if ([...jobs.values()].some((j) => j.unitId === unitId && j.status !== 'DONE'))
      return error(409, 'CONFLICT')
    const id = nextId++
    jobs.set(id, { id, unitId, triggerType: 'ADMIN', targetCount: 10, status: 'QUEUED', polls: 0 })
    return HttpResponse.json({ jobId: id } satisfies Schemas['CreateQuestionJobResponse'], {
      status: 202,
    })
  }),

  http.get('/api/admin/question-jobs/:jobId', ({ params }) => {
    const job = jobs.get(Number(params.jobId))
    if (!job) return error(404, 'NOT_FOUND')
    job.polls++
    if (job.polls >= 2)
      Object.assign(job, { status: 'DONE', generatedCount: 12, passedCount: 10, rejectedCount: 2 })
    else job.status = 'RUNNING'
    const { polls: _polls, ...body } = job
    return HttpResponse.json(body)
  }),

  http.get('/api/admin/reports', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status')
    const all = mockReports.filter((r) => !status || r.status === status)
    return HttpResponse.json(
      paged(all, request) satisfies Schemas['PageResponseAdminReportResponse'],
    )
  }),

  http.patch('/api/admin/reports/:reportId', async ({ request, params }) => {
    const report = mockReports.find((r) => r.id === Number(params.reportId))
    if (!report) return error(404, 'NOT_FOUND')
    const input = (await request.json()) as Schemas['HandleReportRequest']
    if (input.status === 'OPEN') return error(400, 'INVALID_INPUT')
    Object.assign(report, {
      status: input.status,
      resolutionNote: input.resolutionNote,
      handledAt: new Date().toISOString(),
    })
    const question = mockQuestions.find((q) => q.id === report.questionId)
    if (question && input.questionAction === 'RETIRE') question.status = 'RETIRED'
    if (question && input.questionAction === 'RESTORE') question.status = 'VERIFIED'
    return HttpResponse.json(report)
  }),

  http.get('/api/admin/stats/usage', () =>
    HttpResponse.json({
      zone: 'Asia/Seoul',
      from: '2026-11-08',
      to: '2026-11-14',
      activeStudents: 2,
      returningStudents: 1,
      studentMessages: 2,
      rankedBattlesFinished: 1,
      practiceBattlesFinished: 1,
      practiceRetest: { answered: 2, correct: 1, improvedFromWrong: 1, correctRate: 0.5 },
      reviews: { written: 1, causeDisagreed: 0 },
      reports: { question: 1, grading: 0 },
      answersRevealed: 0,
    } satisfies Schemas['UsageStatsResponse']),
  ),

  http.get('/api/admin/stats/ai-calls', () =>
    HttpResponse.json({
      zone: 'Asia/Seoul',
      from: '2026-11-13',
      to: '2026-11-14',
      days: [
        { date: '2026-11-13', total: 0, failed: 0, inputTokens: 0, outputTokens: 0 },
        { date: '2026-11-14', total: 14, failed: 1, inputTokens: 5200, outputTokens: 1800 },
      ],
    } satisfies Schemas['AiCallStatsResponse']),
  ),

  http.get('/api/admin/stats/questions', () =>
    HttpResponse.json({
      minAnswers: 5,
      tooHardAtMost: 0.1,
      tooEasyAtLeast: 0.9,
      tooHard: [],
      tooEasy: [],
    } satisfies QuestionAccuracyResponse),
  ),

  http.get(
    '/api/admin/exports/battle-answers.csv',
    () =>
      new HttpResponse('﻿battle_id,seq,verdict\n1,1,UNKNOWN\n', {
        headers: { 'Content-Type': 'text/csv; charset=utf-8' },
      }),
  ),
]
