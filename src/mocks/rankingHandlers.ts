import { http, HttpResponse } from 'msw'
import type { components } from '@/api/generated/schema'
import { mockBattles, mockRating, OPPONENT } from './battleHandlers'
import { mockNickname, setMockNickname } from './courseData'
import { MOCK_ME } from './fixtures'
import { useScenario } from './scenario'

type Schemas = components['schemas']

const DEPARTMENTS = [
  { id: 1, name: '컴퓨터공학과' },
  { id: 2, name: '경영학과' },
]
let mockDepartmentId = 1

export function resetRankingData() {
  mockDepartmentId = 1
}

/** 끝난 랭킹 배틀만 순위·전적에 센다(연습은 반영되지 않는다). */
const rankedDone = (courseId: number) =>
  mockBattles.filter(
    (b) => b.me.joined && b.mode === 'RANKED' && b.status === 'FINISHED' && b.courseId === courseId,
  )

function tally(courseId: number) {
  const deltas = rankedDone(courseId).map((b) => b.elo?.delta ?? 0)
  return {
    gamesPlayed: deltas.length,
    wins: deltas.filter((d) => d > 0).length,
    losses: deltas.filter((d) => d < 0).length,
    draws: deltas.filter((d) => d === 0).length,
    delta: deltas.reduce((sum, d) => sum + d, 0),
  }
}

function entries(courseId: number) {
  const mine = tally(courseId)
  if (mine.gamesPlayed === 0) return []
  const me = {
    userId: 1,
    nickname: mockNickname,
    departmentName: '컴퓨터공학과',
    rating: mockRating,
    ...mine,
  }
  const opponent = {
    userId: OPPONENT.id,
    nickname: OPPONENT.nickname,
    departmentName: '컴퓨터공학과',
    rating: 2000 - mockRating,
    gamesPlayed: mine.gamesPlayed,
    wins: mine.losses,
    losses: mine.wins,
    draws: mine.draws,
    delta: -mine.delta,
  }
  return [me, opponent]
}

const ranked = <T extends { userId: number }>(list: T[], key: (item: T) => number) =>
  [...list]
    .sort((a, b) => key(b) - key(a) || a.userId - b.userId)
    .map((item, index) => ({ rank: index + 1, ...item }))

const page = <T>(items: T[]) => ({
  items,
  page: 0,
  size: 10,
  totalElements: items.length,
  hasNext: false,
})

export const rankingHandlers = [
  http.get('/api/rankings', ({ request }) => {
    const courseId = Number(new URL(request.url).searchParams.get('courseId'))
    const items = ranked(entries(courseId), (e) => e.rating).map(({ delta: _delta, ...e }) => e)
    return HttpResponse.json({
      ...page(items),
      me: items.find((e) => e.userId === 1),
    } satisfies Schemas['RankingResponse'])
  }),

  http.get('/api/rankings/growth', ({ request }) => {
    const courseId = Number(new URL(request.url).searchParams.get('courseId'))
    const items = ranked(entries(courseId), (e) => e.delta)
    return HttpResponse.json({ ...page(items), me: items.find((e) => e.userId === 1) })
  }),

  http.get('/api/me/records', ({ request }) => {
    const courseId = Number(new URL(request.url).searchParams.get('courseId'))
    const done = rankedDone(courseId)
    if (done.length === 0) return HttpResponse.json([])
    const { wins, losses, draws } = tally(courseId)
    return HttpResponse.json([
      { opponent: OPPONENT, wins, losses, draws, lastBattleAt: done.at(-1)!.createdAt },
    ] satisfies Schemas['OpponentRecordResponse'][])
  }),

  http.get('/api/me/records/:opponentId/battles', ({ request }) => {
    const courseId = Number(new URL(request.url).searchParams.get('courseId'))
    const items = rankedDone(courseId).map(
      (b) =>
        ({
          battleId: b.id,
          course: { id: b.courseId },
          result: (b.elo?.delta ?? 0) > 0 ? 'WIN' : (b.elo?.delta ?? 0) < 0 ? 'LOSE' : 'DRAW',
          myScore: b.answers.reduce((sum, a) => sum + a.score, 0),
          opponentScore: b.answers.reduce((sum, a) => sum + a.opponentScore, 0),
          finishedAt: b.createdAt,
        }) satisfies Schemas['OpponentBattleResponse'],
    )
    return HttpResponse.json(
      page(items.reverse()) satisfies Schemas['PageResponseOpponentBattleResponse'],
    )
  }),

  http.get('/api/me/ratings/history', ({ request }) => {
    const courseId = Number(new URL(request.url).searchParams.get('courseId'))
    const items = rankedDone(courseId).map(
      (b) =>
        ({
          battleId: b.id,
          opponent: OPPONENT,
          ratingBefore: b.elo?.before,
          ratingAfter: b.elo?.after,
          delta: b.elo?.delta,
          createdAt: b.createdAt,
        }) satisfies Schemas['EloHistoryResponse'],
    )
    return HttpResponse.json(
      page(items.reverse()) satisfies Schemas['PageResponseEloHistoryResponse'],
    )
  }),

  // A-07 내 정보 수정
  http.patch('/api/me', async ({ request }) => {
    const input = (await request.json()) as Schemas['UpdateMeRequest']
    if (input.nickname !== undefined) {
      if (!/^[가-힣a-zA-Z0-9_]{2,12}$/.test(input.nickname))
        return HttpResponse.json({ code: 'AUTH_NICKNAME_INVALID' }, { status: 400 })
      if (input.nickname === '사용중')
        return HttpResponse.json({ code: 'AUTH_NICKNAME_TAKEN' }, { status: 409 })
      setMockNickname(input.nickname)
    }
    if (input.departmentId) mockDepartmentId = input.departmentId
    return HttpResponse.json({
      ...MOCK_ME,
      nickname: mockNickname,
      department: DEPARTMENTS.find((d) => d.id === mockDepartmentId),
      role: useScenario.getState().role,
    } satisfies Schemas['MeResponse'])
  }),
]
