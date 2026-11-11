import { ApiError, NETWORK_ERROR_CODE } from './errors'

/**
 * `ApiError.code` → 학생에게 보여 줄 안내문. 코드 목록은 BE 명세(`api-spec.md` 12절)와 같다.
 * 서버가 준 `message`는 화면에 그대로 쓰지 않는다(내부 사정이 섞일 수 있고 말투가 다르다).
 * 화면마다 더 구체적인 안내가 필요하면(예: 노트가 없으면 가르치러 가기 버튼) 코드로 분기해 덧붙인다.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // 공통
  INVALID_INPUT: '입력한 내용을 다시 확인해 주세요.',
  UNAUTHORIZED: '로그인이 필요해요. 다시 로그인해 주세요.',
  FORBIDDEN: '이 화면을 볼 권한이 없어요.',
  NOT_FOUND: '찾을 수 없는 내용이에요.',
  CONFLICT: '지금은 할 수 없는 요청이에요. 새로고침한 뒤 다시 시도해 주세요.',
  RATE_LIMITED: '요청이 너무 많아요. 잠시 뒤에 다시 시도해 주세요.',
  INTERNAL_ERROR: '서버에 문제가 생겼어요. 잠시 뒤에 다시 시도해 주세요.',

  // AI
  AI_RATE_LIMITED: 'AI가 잠시 바빠요. 조금 뒤에 다시 보내 주세요.',
  AI_UNAVAILABLE: 'AI에 연결하지 못했어요. 같은 내용을 다시 보내 주세요.',
  AI_TIMEOUT: 'AI가 답하는 데 너무 오래 걸렸어요. 다시 시도해 주세요.',
  AI_BAD_RESPONSE: 'AI의 답을 읽지 못했어요. 다시 시도해 주세요.',

  // 인증
  AUTH_GOOGLE_TOKEN_INVALID: 'Google 로그인을 확인하지 못했어요. 다시 로그인해 주세요.',
  AUTH_EMAIL_DOMAIN_NOT_ALLOWED: '학교 Google 계정으로만 로그인할 수 있어요.',
  AUTH_SIGNUP_TOKEN_INVALID: '가입 시간이 지났어요. 처음부터 다시 로그인해 주세요.',
  AUTH_NICKNAME_TAKEN: '이미 쓰고 있는 닉네임이에요.',
  AUTH_NICKNAME_INVALID: '닉네임은 2~12자의 한글·영문·숫자·_만 쓸 수 있어요.',
  AUTH_TERMS_REQUIRED: '약관에 동의해야 가입할 수 있어요.',

  // 과목·제자
  COURSE_DUPLICATE: '이미 있는 과목이에요.',
  UNIT_DUPLICATE: '이미 있는 주차예요.',
  UNIT_NOT_IN_COURSE: '이 과목의 주차가 아니에요.',
  DISCIPLE_ALREADY_EXISTS: '이 과목에는 이미 제자가 있어요.',
  DISCIPLE_NOT_FOUND: '이 과목에는 아직 제자가 없어요. 먼저 제자를 만들어 주세요.',

  // 자료
  MATERIAL_CONSENT_REQUIRED: '자료 사용에 동의해야 올릴 수 있어요.',
  MATERIAL_INVALID_FILE: 'PDF 파일만 올릴 수 있어요.',
  MATERIAL_TOO_LARGE: '자료가 너무 커요. 20MB 이하의 PDF나 더 짧은 글을 올려 주세요.',

  // 가르치기
  TEACHING_CONCURRENT_TURN: '앞의 메시지를 처리하는 중이에요. 잠시 뒤에 다시 보내 주세요.',
  TEACHING_NOTE_MERGE_INVALID: '이 노트들은 합칠 수 없어요.',

  // 배틀
  BATTLE_ROOM_NOT_FOUND: '없는 방이에요. 방 코드를 다시 확인해 주세요.',
  BATTLE_ROOM_FULL: '이미 두 명이 들어와 있는 방이에요.',
  BATTLE_ROOM_EXPIRED: '시간이 지나 닫힌 방이에요. 새로 만들어 주세요.',
  BATTLE_SELF_JOIN: '내가 만든 방에는 들어갈 수 없어요.',
  BATTLE_ALREADY_ACTIVE: '이미 진행 중인 배틀 방이 있어요. 먼저 끝내거나 취소해 주세요.',
  BATTLE_DISCIPLE_REQUIRED: '이 과목의 제자가 있어야 배틀할 수 있어요.',
  BATTLE_QUESTION_BANK_NOT_READY:
    '이 주차는 아직 배틀할 문제가 모자라요. 문제 수를 줄이거나 다른 주차를 골라 주세요.',
  BATTLE_NOT_ENOUGH_QUESTIONS:
    '둘 다 안 본 문제가 문제 수보다 적어요. 방을 취소하고 문제 수를 줄여 다시 만들어 주세요.',
  BATTLE_NOT_FINISHED: '아직 끝나지 않은 배틀이에요.',
  BATTLE_NOTES_REQUIRED: '이 주차에 내 노트가 없어요. 먼저 마리를 가르쳐 주세요.',
  PRACTICE_NOTHING_TO_REVIEW: '다시 풀 수 있는 문제가 없어요.',
  PRACTICE_ANSWERS_REVEALED: '정답을 열어서 이 배틀은 더 연습할 수 없어요.',

  // 복기·신고
  REVIEW_NOTES_NOT_PUBLIC: '상대가 노트를 공개하지 않았어요.',
  REVIEW_ALREADY_SUBMITTED: '이미 리뷰를 남겼어요.',
  REPORT_DUPLICATE: '이미 신고한 내용이에요.',

  // 서버에 닿지 못함(FE에서 만든 코드)
  [NETWORK_ERROR_CODE]: '서버에 연결할 수 없어요. 인터넷 연결을 확인하고 다시 시도해 주세요.',
}

const DEFAULT_MESSAGE = '요청을 처리하지 못했어요. 잠시 뒤에 다시 시도해 주세요.'

/** 어떤 오류든 화면에 보여 줄 한국어 문장으로 바꾼다. 모르는 코드는 상태에 따라 일반 문구로 대신한다. */
export function getErrorMessage(error: unknown, fallback: string = DEFAULT_MESSAGE): string {
  if (!(error instanceof ApiError)) return fallback
  const known = ERROR_MESSAGES[error.code]
  if (known) return known
  if (error.status >= 500) return ERROR_MESSAGES.INTERNAL_ERROR ?? fallback
  return fallback
}

/** 서버에 닿지 못한 오류인가(서버 꺼짐·인터넷 끊김). */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.code === NETWORK_ERROR_CODE
}

/** 특정 코드의 `ApiError` 인가. 화면이 코드별로 분기할 때 쓴다(메시지 문자열은 비교하지 않는다). */
export function hasErrorCode(error: unknown, code: string): boolean {
  return error instanceof ApiError && error.code === code
}
