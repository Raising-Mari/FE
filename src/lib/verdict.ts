/** 채점 결과·승패 이름. 결과·복기·기록·랭킹 화면이 같은 말을 쓰도록 한 곳에 둔다. */
export type VerdictCode =
  'CORRECT' | 'PARTIAL' | 'WRONG' | 'UNKNOWN' | 'ZEROED_INJECTION' | 'UNJUDGED' | 'PENDING'

export const VERDICT_LABEL: Record<VerdictCode, string> = {
  CORRECT: '정답',
  PARTIAL: '부분 정답',
  WRONG: '오답',
  UNKNOWN: '모름',
  ZEROED_INJECTION: '0점 처리',
  UNJUDGED: '판정 실패',
  PENDING: '채점 중',
}

export type ResultCode = 'WIN' | 'LOSE' | 'DRAW'

export const RESULT_LABEL: Record<ResultCode, string> = {
  WIN: '승리',
  LOSE: '패배',
  DRAW: '무승부',
}
/** 목록에서 쓰는 한 글자 표기(시안 22: "무 · 0 : 0"). */
export const RESULT_SHORT: Record<ResultCode, string> = { WIN: '승', LOSE: '패', DRAW: '무' }
