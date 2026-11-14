import { http, HttpResponse } from 'msw'
import type { components } from '@/api/generated/schema'
import type { ReviewCause, ReviewItem, ReviewResponse, Verdict } from '@/api/overrides'
import { mockCourses, mockDisciples, mockNickname, mockUnits } from './courseData'
import { useScenario } from './scenario'
import { notesOf } from './teachingHandlers'

type Schemas = components['schemas']
type BattleStatus = NonNullable<Schemas['BattleResponse']['status']>

interface MockAnswer {
  battleAnswerId: number
  seq: number
  stem: string
  referenceAnswer: string
  answerText: string | null
  verdict: Verdict
  score: number
  opponentVerdict: Verdict
  opponentScore: number
  usedNotes: { id: number; content: string }[]
  review: ReviewItem['myReview']
  reports: Set<string>
  retestOf?: { battleAnswerId: number; verdict: Verdict }
}

export interface MockBattle {
  id: number
  status: BattleStatus
  mode: 'RANKED' | 'PRACTICE'
  courseId: number
  unitId: number
  questionCount: number
  roomCode: string
  expiresAt: string
  createdAt: string
  /** 내가 만든 방인가(아니면 상대가 만든 방에 내가 들어간 것). */
  hostIsMe: boolean
  me: { joined: boolean; status: 'JOINED' | 'READY'; solveStatus: Participant['solveStatus'] }
  opponent: { status: 'JOINED' | 'READY'; solveStatus: Participant['solveStatus'] } | null
  myNotesPublic: boolean
  /** 상태를 물어본 횟수. 목업에서는 이것으로 상대 입장·준비·풀이 완료를 흉내 낸다. */
  polls: number
  answers: MockAnswer[]
  answersRevealedAt: string | null
  sourceBattleId?: number
  elo: { before: number; after: number; delta: number } | null
  noteSnapshot: { id: number; content: string }[]
  noteReview: Schemas['NoteReviewResponse'] | null
}
type Participant = Schemas['Participant']

export const OPPONENT = { id: 2, nickname: '지우' }
const OPPONENT_NOTES = [
  '나중에 넣은 데이터가 먼저 나오는 LIFO 구조입니다.',
  '먼저 넣은 데이터가 먼저 나오는 FIFO 구조입니다.',
  'push는 스택의 맨 위에 데이터를 추가합니다.',
  'pop은 스택의 맨 위 데이터를 꺼냅니다.',
  'peek는 맨 위의 값을 제거하지 않고 확인합니다.',
  'enqueue는 큐의 뒤에 데이터를 추가합니다.',
  'dequeue는 큐의 앞에서 데이터를 꺼냅니다.',
]

/**
 * 끝난 배틀의 복기에 나오는 예시 문항. 시안(17~21)에 실린 시연 공개 예문만 쓴다 — 실제 문제 은행의 문항·정답은 넣지 않는다.
 * 진행 중인 배틀의 응답에는 싣지 않는다(서버와 같다).
 */
const DEMO_QUESTIONS = [
  [
    '배열 스택이 가득 찼을 때 생길 수 있는 오류는?',
    '용량을 초과하여 push하면 overflow가 발생할 수 있습니다.',
  ],
  ['스택의 맨 위 위치를 가리키는 것은?', 'top은 스택의 맨 위 위치를 가리킵니다.'],
  ['큐에서 앞과 뒤의 위치를 가리키는 이름은?', 'front는 큐의 앞, rear는 큐의 뒤를 가리킵니다.'],
  [
    '배열의 끝과 처음을 연결해서 공간을 재사용하는 큐는?',
    '원형 큐는 배열의 끝과 처음을 이어 공간을 재사용합니다.',
  ],
  ['양쪽 끝에서 삽입과 삭제가 가능한 구조는?', '덱은 양쪽 끝에서 삽입과 삭제가 가능합니다.'],
  ['스택은 어떤 순서로 데이터를 꺼내나요?', '스택은 나중에 넣은 데이터를 먼저 꺼냅니다.'],
  ['큐는 어떤 순서로 데이터를 꺼내나요?', '큐는 먼저 넣은 데이터를 먼저 꺼냅니다.'],
  ['스택에 데이터를 추가하는 연산은 무엇인가요?', 'push는 스택에 데이터를 추가합니다.'],
  ['스택의 맨 위 데이터를 꺼내는 연산은 무엇인가요?', 'pop은 스택의 맨 위 데이터를 꺼냅니다.'],
  ['큐의 뒤에 데이터를 넣는 연산은 무엇인가요?', 'enqueue는 큐의 뒤에 데이터를 넣습니다.'],
] as const
const UNKNOWN_TEXT = '아직 배운 노트에서 답을 찾지 못했어요.'
const MATERIAL_TITLE = '스택과 큐 · 시연 공개 예문'

export const mockBattles: MockBattle[] = []
export let mockRating = 1000
let nextBattleId = 1

const error = (status: number, code: string, details?: Record<string, unknown>) =>
  HttpResponse.json({ code, message: '', ...(details ? { details } : {}) }, { status })
const noContent = () => new HttpResponse(null, { status: 204 })
const find = (id: unknown) => mockBattles.find((b) => b.id === Number(id))
const isActive = (b: MockBattle) => ['WAITING', 'LOBBY', 'RUNNING', 'ERROR'].includes(b.status)
const total = (answers: MockAnswer[]) => answers.reduce((sum, a) => sum + a.score, 0)
const opponentTotal = (answers: MockAnswer[]) => answers.reduce((s, a) => s + a.opponentScore, 0)

function makeAnswers(battle: MockBattle, verdicts: Verdict[]): MockAnswer[] {
  const score: Partial<Record<Verdict, number>> = { CORRECT: 1, PARTIAL: 0.5, WRONG: -0.5 }
  return verdicts.map((verdict, index) => {
    const [stem, referenceAnswer] = DEMO_QUESTIONS[index % DEMO_QUESTIONS.length]!
    const note = battle.noteSnapshot[index % Math.max(1, battle.noteSnapshot.length)]
    return {
      battleAnswerId: battle.id * 100 + index + 1,
      seq: index + 1,
      stem,
      referenceAnswer,
      answerText:
        verdict === 'UNKNOWN'
          ? UNKNOWN_TEXT
          : verdict === 'CORRECT'
            ? referenceAnswer
            : '스택이 비어 있어서 생기는 오류입니다.',
      verdict,
      score: score[verdict] ?? 0,
      opponentVerdict: 'UNKNOWN',
      opponentScore: 0,
      usedNotes: verdict === 'UNKNOWN' || !note ? [] : [note],
      review: null,
      reports: new Set(),
    }
  })
}

function finish(battle: MockBattle) {
  battle.status = 'FINISHED'
  battle.me.solveStatus = 'SOLVED'
  if (battle.opponent) battle.opponent.solveStatus = 'SOLVED'
  if (battle.mode === 'PRACTICE') {
    // 연습은 고른 답의 같은 문항을 다시 푼다. 목업에서는 모두 맞힌 것으로 한다.
    for (const answer of battle.answers) {
      answer.verdict = 'CORRECT'
      answer.score = 1
      answer.answerText = answer.referenceAnswer
    }
    return
  }
  const verdicts: Verdict[] = ['CORRECT', 'WRONG', 'UNKNOWN', 'PARTIAL', 'UNKNOWN']
  battle.answers = makeAnswers(
    battle,
    Array.from({ length: battle.questionCount }, (_, i) => verdicts[i % verdicts.length]!),
  )
  const mine = total(battle.answers)
  const delta = mine > 0 ? 12 : mine < 0 ? -12 : 0
  battle.elo = { before: mockRating, after: mockRating + delta, delta }
  mockRating += delta
}

/** 상태를 물을 때마다 한 걸음 진행한다: 상대 입장 → 상대 준비 → 풀이 → 완료(또는 오류). */
function advance(battle: MockBattle) {
  const { opponentAuto, battleFail, set } = useScenario.getState()
  battle.polls++
  if (battle.status === 'WAITING' && opponentAuto && battle.polls >= 2) {
    battle.opponent = { status: 'JOINED', solveStatus: 'PENDING' }
    battle.status = 'LOBBY'
    battle.polls = 0
  } else if (battle.status === 'LOBBY' && battle.opponent) {
    if (opponentAuto && battle.me.status === 'READY' && battle.polls >= 2)
      battle.opponent.status = 'READY'
    if (battle.me.status === 'READY' && battle.opponent.status === 'READY') {
      battle.status = 'RUNNING'
      battle.me.solveStatus = 'SOLVING'
      battle.opponent.solveStatus = 'SOLVING'
      battle.polls = 0
    }
  } else if (battle.status === 'RUNNING' && battle.polls >= 2) {
    if (battleFail) {
      set({ battleFail: false })
      battle.status = 'ERROR'
      battle.me.solveStatus = 'FAILED'
    } else finish(battle)
  }
}

function result(battle: MockBattle): Schemas['Summary']['result'] {
  const diff = total(battle.answers) - opponentTotal(battle.answers)
  return diff > 0 ? 'WIN' : diff < 0 ? 'LOSE' : 'DRAW'
}

function toResponse(battle: MockBattle): Schemas['BattleResponse'] {
  const course = mockCourses.find((c) => c.id === battle.courseId)
  const unit = (mockUnits.get(battle.courseId) ?? []).find((u) => u.id === battle.unitId)
  const participants: Participant[] = [
    { userId: 1, nickname: mockNickname, isMe: true, ...battle.me },
  ]
  if (battle.opponent)
    participants.push({
      userId: OPPONENT.id,
      nickname: OPPONENT.nickname,
      isMe: false,
      ...battle.opponent,
    })
  const ranked = battle.mode === 'RANKED'
  return {
    id: battle.id,
    status: battle.status,
    mode: battle.mode,
    course: { id: battle.courseId, name: course?.name },
    unit: { id: battle.unitId, title: unit?.title },
    questionCount: battle.questionCount,
    roomCode: ranked ? battle.roomCode : undefined,
    expiresAt: battle.expiresAt,
    participants: participants.map(({ ...p }) => {
      delete (p as { joined?: boolean }).joined
      return p
    }),
    summary:
      battle.status === 'FINISHED'
        ? {
            myScore: total(battle.answers),
            ...(ranked
              ? {
                  opponentScore: opponentTotal(battle.answers),
                  result: result(battle),
                  eloDelta: battle.elo?.delta,
                }
              : {}),
          }
        : undefined,
  }
}

function newBattle(
  partial: Partial<MockBattle> & Pick<MockBattle, 'courseId' | 'unitId'>,
): MockBattle {
  const id = nextBattleId++
  const battle: MockBattle = {
    id,
    status: 'WAITING',
    mode: 'RANKED',
    questionCount: 5,
    roomCode: Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, 'X'),
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    createdAt: new Date().toISOString(),
    hostIsMe: true,
    me: { joined: true, status: 'JOINED', solveStatus: 'PENDING' },
    opponent: null,
    myNotesPublic: false,
    polls: 0,
    answers: [],
    answersRevealedAt: null,
    elo: null,
    noteSnapshot: [],
    noteReview: null,
    ...partial,
  }
  mockBattles.push(battle)
  return battle
}

/** 시안 17·22와 같은 끝난 배틀 하나(무승부, 모두 모름)와 상대가 만들어 둔 대기 방 하나(코드 MARI24)로 시작한다. */
export function resetBattleData() {
  mockBattles.length = 0
  nextBattleId = 1
  mockRating = 1000
  const done = newBattle({
    courseId: 1,
    unitId: 1,
    status: 'FINISHED',
    roomCode: '67CC14',
    createdAt: '2026-11-07T11:24:00Z',
    me: { joined: true, status: 'READY', solveStatus: 'SOLVED' },
    opponent: { status: 'READY', solveStatus: 'SOLVED' },
    myNotesPublic: true,
    elo: { before: 1000, after: 1000, delta: 0 },
    noteSnapshot: notesOf(1, 1).map(({ id, content }) => ({ id, content })),
  })
  done.answers = makeAnswers(
    done,
    Array.from({ length: 5 }, () => 'UNKNOWN' as const),
  )
  newBattle({
    courseId: 1,
    unitId: 1,
    roomCode: 'MARI24',
    hostIsMe: false,
    me: { joined: false, status: 'JOINED', solveStatus: 'PENDING' },
    opponent: { status: 'JOINED', solveStatus: 'PENDING' },
  })
}

function toReviewItem(battle: MockBattle, answer: MockAnswer): ReviewItem {
  const revealed = battle.answersRevealedAt !== null
  const suggestion: ReviewCause | null =
    answer.verdict === 'CORRECT' ? null : answer.usedNotes.length ? 'NOTE_WRONG' : 'NOT_TAUGHT'
  return {
    battleAnswerId: answer.battleAnswerId,
    seq: answer.seq,
    question: {
      id: answer.seq,
      stem: answer.stem,
      ...(revealed ? { referenceAnswer: answer.referenceAnswer } : {}),
    },
    disciple: {
      answerText: answer.answerText,
      isUnknown: answer.verdict === 'UNKNOWN',
      verdict: answer.verdict,
      finalScore: answer.score,
      copyFactor: 1,
      injectionFlag: answer.verdict === 'ZEROED_INJECTION',
    },
    usedNotes: answer.usedNotes,
    causeSuggestion: suggestion,
    myReview: answer.review,
    practiceAvailable: !revealed,
    ...(revealed
      ? { evidence: { text: answer.referenceAnswer, materialTitle: MATERIAL_TITLE } }
      : {}),
  }
}

const findAnswer = (answerId: unknown) => {
  for (const battle of mockBattles) {
    const answer = battle.answers.find((a) => a.battleAnswerId === Number(answerId))
    if (answer) return { battle, answer }
  }
  return null
}

/** 끝난 랭킹 배틀만 통과시키는 공통 검사(B-07·R-01 과 같은 순서). */
function finishedRanked(id: unknown) {
  const battle = find(id)
  if (!battle || !battle.me.joined) return error(404, 'NOT_FOUND')
  if (battle.mode === 'PRACTICE') return error(400, 'INVALID_INPUT')
  if (battle.status !== 'FINISHED') return error(409, 'BATTLE_NOT_FINISHED')
  return battle
}

const notesPublicBoth = (battle: MockBattle) =>
  battle.myNotesPublic && useScenario.getState().opponentNotesPublic

export const battleHandlers = [
  http.get('/api/units/:unitId/battle-readiness', ({ request, params }) => {
    const required = Number(new URL(request.url).searchParams.get('questionCount') ?? 5)
    // 시연 자료가 연결된 1주차에만 문제가 있다고 본다.
    const availableForMe = Number(params.unitId) === 1 ? 24 : 0
    return HttpResponse.json({
      ready: availableForMe >= required,
      availableForMe,
      required,
    } satisfies Schemas['BattleReadinessResponse'])
  }),

  http.get('/api/battles', ({ request }) => {
    const query = new URL(request.url).searchParams
    const page = Number(query.get('page') ?? 0)
    const size = Number(query.get('size') ?? 20)
    const all = mockBattles
      .filter((b) => b.me.joined)
      .filter((b) => !query.get('mode') || b.mode === query.get('mode'))
      .filter((b) => !query.get('status') || b.status === query.get('status'))
      .filter((b) => !query.get('courseId') || b.courseId === Number(query.get('courseId')))
      .sort((a, b) => b.id - a.id)
    const items = all.slice(page * size, (page + 1) * size).map((b) => {
      const full = toResponse(b)
      return {
        id: b.id,
        mode: b.mode,
        status: b.status,
        course: full.course,
        unit: full.unit,
        opponent: b.opponent && b.mode === 'RANKED' ? OPPONENT : undefined,
        myScore: full.summary?.myScore,
        result: full.summary?.result,
        createdAt: b.createdAt,
      } satisfies Schemas['BattleSummaryResponse']
    })
    return HttpResponse.json({
      items,
      page,
      size,
      totalElements: all.length,
      hasNext: all.length > (page + 1) * size,
    } satisfies Schemas['PageResponseBattleSummaryResponse'])
  }),

  http.post('/api/battles', async ({ request }) => {
    const input = (await request.json()) as Schemas['CreateBattleRequest']
    const disciple = mockDisciples.get(input.courseId)
    if (!disciple) return error(409, 'BATTLE_DISCIPLE_REQUIRED')
    if (mockBattles.some((b) => b.me.joined && b.mode === 'RANKED' && isActive(b)))
      return error(409, 'BATTLE_ALREADY_ACTIVE')
    const questionCount = input.questionCount ?? 5
    if (input.unitId !== 1) return error(409, 'BATTLE_QUESTION_BANK_NOT_READY')
    const unit = (mockUnits.get(input.courseId) ?? []).find((u) => u.id === input.unitId)
    if (notesOf(disciple.id!, input.unitId).length === 0)
      return error(409, 'BATTLE_NOTES_REQUIRED', {
        courseId: input.courseId,
        unit: { id: unit?.id, title: unit?.title },
      })
    const battle = newBattle({ courseId: input.courseId, unitId: input.unitId, questionCount })
    return HttpResponse.json(
      {
        id: battle.id,
        roomCode: battle.roomCode,
        status: battle.status,
        expiresAt: battle.expiresAt,
      } satisfies Schemas['CreateBattleResponse'],
      { status: 201 },
    )
  }),

  http.post('/api/battles/join', async ({ request }) => {
    const { roomCode } = (await request.json()) as Schemas['JoinBattleRequest']
    const code = roomCode.replace(/\s/g, '').toUpperCase()
    const battle = mockBattles.find((b) => b.roomCode === code && b.mode === 'RANKED')
    if (!battle) return error(404, 'BATTLE_ROOM_NOT_FOUND')
    if (battle.status === 'EXPIRED') return error(409, 'BATTLE_ROOM_EXPIRED')
    if (battle.hostIsMe) return error(409, 'BATTLE_SELF_JOIN')
    if (battle.me.joined) return HttpResponse.json(toResponse(battle))
    if (battle.status !== 'WAITING') return error(404, 'BATTLE_ROOM_NOT_FOUND')
    const disciple = mockDisciples.get(battle.courseId)
    if (!disciple) return error(409, 'BATTLE_DISCIPLE_REQUIRED')
    if (notesOf(disciple.id!, battle.unitId).length === 0) {
      const unit = (mockUnits.get(battle.courseId) ?? []).find((u) => u.id === battle.unitId)
      return error(409, 'BATTLE_NOTES_REQUIRED', {
        courseId: battle.courseId,
        unit: { id: unit?.id, title: unit?.title },
      })
    }
    battle.me.joined = true
    battle.status = 'LOBBY'
    battle.polls = 0
    return HttpResponse.json(toResponse(battle))
  }),

  http.post('/api/battles/practice', async ({ request }) => {
    const input = (await request.json()) as Schemas['CreatePracticeRequest']
    const source = finishedRanked(input.sourceBattleId)
    if (source instanceof Response) return source
    if (source.answersRevealedAt) return error(409, 'PRACTICE_ANSWERS_REVEALED')
    const targets = source.answers.filter((a) =>
      input.battleAnswerIds
        ? input.battleAnswerIds.includes(a.battleAnswerId)
        : a.verdict !== 'CORRECT',
    )
    if (targets.length === 0) return error(409, 'PRACTICE_NOTHING_TO_REVIEW')
    const battle = newBattle({
      courseId: source.courseId,
      unitId: source.unitId,
      mode: 'PRACTICE',
      status: 'RUNNING',
      questionCount: targets.length,
      sourceBattleId: source.id,
      me: { joined: true, status: 'READY', solveStatus: 'SOLVING' },
    })
    battle.answers = targets.map((a, index) => ({
      ...a,
      battleAnswerId: battle.id * 100 + index + 1,
      seq: index + 1,
      review: null,
      reports: new Set<string>(),
      retestOf: { battleAnswerId: a.battleAnswerId, verdict: a.verdict },
    }))
    return HttpResponse.json(
      {
        id: battle.id,
        mode: 'PRACTICE',
        status: 'RUNNING',
        questionCount: targets.length,
        skippedAnswerIds: [],
      } satisfies Schemas['CreatePracticeResponse'],
      { status: 201 },
    )
  }),

  http.get('/api/battles/:battleId', ({ params }) => {
    const battle = find(params.battleId)
    if (!battle || !battle.me.joined) return error(404, 'NOT_FOUND')
    advance(battle)
    return HttpResponse.json(toResponse(battle))
  }),

  http.post('/api/battles/:battleId/ready', async ({ request, params }) => {
    const battle = find(params.battleId)
    if (!battle || !battle.me.joined) return error(404, 'NOT_FOUND')
    if (battle.me.status === 'READY') return noContent()
    if (battle.status !== 'LOBBY') return error(409, 'CONFLICT')
    const input = (await request.json().catch(() => ({}))) as Schemas['ReadyRequest']
    const disciple = mockDisciples.get(battle.courseId)
    const notes = disciple ? notesOf(disciple.id!, battle.unitId) : []
    if (notes.length === 0) return error(409, 'BATTLE_NOTES_REQUIRED')
    battle.me.status = 'READY'
    battle.myNotesPublic = input.notesPublic === true
    battle.noteSnapshot = notes.map(({ id, content }) => ({ id, content }))
    battle.polls = 0
    return noContent()
  }),

  http.post('/api/battles/:battleId/cancel', ({ params }) => {
    const battle = find(params.battleId)
    if (!battle || !battle.me.joined) return error(404, 'NOT_FOUND')
    if (battle.status === 'CANCELED') return noContent()
    if (!['WAITING', 'LOBBY', 'ERROR'].includes(battle.status)) return error(409, 'CONFLICT')
    battle.status = 'CANCELED'
    return noContent()
  }),

  http.post('/api/battles/:battleId/solve/retry', ({ params }) => {
    const battle = find(params.battleId)
    if (!battle || !battle.me.joined) return error(404, 'NOT_FOUND')
    if (battle.status !== 'ERROR') return error(409, 'CONFLICT')
    battle.status = 'RUNNING'
    battle.me.solveStatus = 'SOLVING'
    battle.polls = 0
    return new HttpResponse(null, { status: 202 })
  }),

  http.patch('/api/battles/:battleId/participants/me', async ({ request, params }) => {
    const battle = find(params.battleId)
    if (!battle || !battle.me.joined) return error(404, 'NOT_FOUND')
    battle.myNotesPublic = (
      (await request.json()) as Schemas['UpdateParticipantRequest']
    ).notesPublic
    return noContent()
  }),

  http.get('/api/battles/:battleId/result', ({ params }) => {
    const battle = find(params.battleId)
    if (!battle || !battle.me.joined) return error(404, 'NOT_FOUND')
    if (battle.status !== 'FINISHED') return error(409, 'BATTLE_NOT_FINISHED')
    const ranked = battle.mode === 'RANKED'
    const count = (v: Verdict) => battle.answers.filter((a) => a.verdict === v).length
    return HttpResponse.json({
      mode: battle.mode,
      sourceBattleId: battle.sourceBattleId,
      me: {
        totalScore: total(battle.answers),
        correct: count('CORRECT'),
        partial: count('PARTIAL'),
        wrong: count('WRONG'),
        unknown: count('UNKNOWN'),
      },
      opponent: ranked
        ? {
            totalScore: opponentTotal(battle.answers),
            correct: 0,
            partial: 0,
            wrong: 0,
            unknown: battle.answers.length,
          }
        : undefined,
      result: ranked ? result(battle) : undefined,
      elo: ranked ? (battle.elo ?? undefined) : undefined,
      questions: battle.answers.map((a) => ({
        seq: a.seq,
        stem: a.stem,
        myAnswerText: a.answerText ?? undefined,
        myVerdict: a.verdict,
        myScore: a.score,
        ...(ranked ? { opponentVerdict: a.opponentVerdict, opponentScore: a.opponentScore } : {}),
        ...(ranked && notesPublicBoth(battle) ? { opponentAnswerText: UNKNOWN_TEXT } : {}),
        retestOf: a.retestOf,
      })),
    } satisfies Schemas['BattleResultResponse'])
  }),

  http.get('/api/battles/:battleId/review', ({ params }) => {
    const battle = finishedRanked(params.battleId)
    if (battle instanceof Response) return battle
    return HttpResponse.json({
      answersRevealed: battle.answersRevealedAt !== null,
      items: battle.answers.map((a) => toReviewItem(battle, a)),
    } satisfies ReviewResponse)
  }),

  http.post('/api/battles/:battleId/reveal-answers', ({ params }) => {
    const battle = finishedRanked(params.battleId)
    if (battle instanceof Response) return battle
    battle.answersRevealedAt ??= new Date().toISOString()
    return HttpResponse.json({
      answersRevealed: true,
      revealedAt: battle.answersRevealedAt,
    } satisfies Schemas['RevealAnswersResponse'])
  }),

  http.put('/api/battle-answers/:answerId/review', async ({ request, params }) => {
    const found = findAnswer(params.answerId)
    if (!found) return error(404, 'NOT_FOUND')
    const input = (await request.json()) as Schemas['SaveReviewRequest']
    found.answer.review = {
      userCause: input.userCause,
      studyMemo: input.studyMemo || null,
      aiMemo: input.aiMemo || null,
      sourceNote: input.sourceNote || null,
      reasonNote: input.reasonNote || null,
    }
    return HttpResponse.json({
      battleAnswerId: found.answer.battleAnswerId,
      userCause: input.userCause,
      studyMemo: input.studyMemo || undefined,
      aiMemo: input.aiMemo || undefined,
      sourceNote: input.sourceNote || undefined,
      reasonNote: input.reasonNote || undefined,
    } satisfies Schemas['ReviewEntryResponse'])
  }),

  http.post('/api/battle-answers/:answerId/reports', async ({ request, params }) => {
    const found = findAnswer(params.answerId)
    if (!found) return error(404, 'NOT_FOUND')
    const input = (await request.json()) as Schemas['CreateReportRequest']
    if (found.answer.reports.has(input.kind)) return error(409, 'REPORT_DUPLICATE')
    found.answer.reports.add(input.kind)
    return HttpResponse.json(
      {
        id: found.answer.battleAnswerId,
        kind: input.kind,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      } satisfies Schemas['ReportResponse'],
      { status: 201 },
    )
  }),

  http.get('/api/battles/:battleId/opponent-notes', ({ params }) => {
    const battle = finishedRanked(params.battleId)
    if (battle instanceof Response) return battle
    if (!notesPublicBoth(battle)) return error(403, 'REVIEW_NOTES_NOT_PUBLIC')
    return HttpResponse.json({
      battleId: battle.id,
      opponent: OPPONENT,
      notes: OPPONENT_NOTES.map((content, index) => ({ id: 9000 + index, content })),
    } satisfies Schemas['OpponentNotesResponse'])
  }),

  http.get('/api/battles/:battleId/note-reviews', ({ params }) => {
    const battle = finishedRanked(params.battleId)
    if (battle instanceof Response) return battle
    return HttpResponse.json({
      written: battle.noteReview ?? undefined,
    } satisfies Schemas['NoteReviewsResponse'])
  }),

  http.post('/api/battles/:battleId/note-reviews', async ({ request, params }) => {
    const battle = finishedRanked(params.battleId)
    if (battle instanceof Response) return battle
    if (!notesPublicBoth(battle)) return error(403, 'REVIEW_NOTES_NOT_PUBLIC')
    if (battle.noteReview) return error(409, 'REVIEW_ALREADY_SUBMITTED')
    const input = (await request.json()) as Schemas['WriteNoteReviewRequest']
    const index = input.evidenceNoteEntryId ? input.evidenceNoteEntryId - 9000 : -1
    battle.noteReview = {
      id: battle.id,
      battleId: battle.id,
      reviewer: { userId: 1, nickname: mockNickname },
      target: { userId: OPPONENT.id, nickname: OPPONENT.nickname },
      goodPoints: input.goodPoints,
      suggestions: input.suggestions,
      evidenceNote:
        OPPONENT_NOTES[index] !== undefined
          ? { id: input.evidenceNoteEntryId, content: OPPONENT_NOTES[index] }
          : undefined,
      createdAt: new Date().toISOString(),
    }
    return HttpResponse.json(battle.noteReview, { status: 201 })
  }),
]
