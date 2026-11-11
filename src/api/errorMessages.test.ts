import { ERROR_MESSAGES, getErrorMessage, hasErrorCode, isNetworkError } from './errorMessages'
import { ApiError, NETWORK_ERROR_CODE } from './errors'

/** BE 명세(api-spec.md 12절)에 적힌 코드 전부. 서버에 코드가 늘면 여기와 안내문 표를 같이 늘린다. */
const SPEC_CODES = [
  'INVALID_INPUT',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'AI_RATE_LIMITED',
  'AI_UNAVAILABLE',
  'AI_TIMEOUT',
  'AI_BAD_RESPONSE',
  'AUTH_GOOGLE_TOKEN_INVALID',
  'AUTH_EMAIL_DOMAIN_NOT_ALLOWED',
  'AUTH_SIGNUP_TOKEN_INVALID',
  'AUTH_NICKNAME_TAKEN',
  'AUTH_NICKNAME_INVALID',
  'AUTH_TERMS_REQUIRED',
  'COURSE_DUPLICATE',
  'UNIT_DUPLICATE',
  'UNIT_NOT_IN_COURSE',
  'DISCIPLE_ALREADY_EXISTS',
  'DISCIPLE_NOT_FOUND',
  'MATERIAL_CONSENT_REQUIRED',
  'MATERIAL_INVALID_FILE',
  'MATERIAL_TOO_LARGE',
  'TEACHING_CONCURRENT_TURN',
  'TEACHING_NOTE_MERGE_INVALID',
  'BATTLE_ROOM_NOT_FOUND',
  'BATTLE_ROOM_FULL',
  'BATTLE_ROOM_EXPIRED',
  'BATTLE_SELF_JOIN',
  'BATTLE_ALREADY_ACTIVE',
  'BATTLE_DISCIPLE_REQUIRED',
  'BATTLE_QUESTION_BANK_NOT_READY',
  'BATTLE_NOT_ENOUGH_QUESTIONS',
  'BATTLE_NOT_FINISHED',
  'BATTLE_NOTES_REQUIRED',
  'PRACTICE_NOTHING_TO_REVIEW',
  'PRACTICE_ANSWERS_REVEALED',
  'REVIEW_NOTES_NOT_PUBLIC',
  'REVIEW_ALREADY_SUBMITTED',
  'REPORT_DUPLICATE',
]

describe('ERROR_MESSAGES', () => {
  it.each(SPEC_CODES)('명세의 %s 코드에 안내문이 있다', (code) => {
    expect(ERROR_MESSAGES[code]).toBeTruthy()
  })

  it('서버에 닿지 못한 경우(NETWORK_ERROR)에도 안내문이 있다', () => {
    expect(ERROR_MESSAGES[NETWORK_ERROR_CODE]).toBeTruthy()
  })
})

describe('getErrorMessage', () => {
  it('알려진 코드는 표의 안내문을 돌려준다', () => {
    const error = new ApiError(409, {
      code: 'BATTLE_NOTES_REQUIRED',
      message: 'English internal text',
    })
    expect(getErrorMessage(error)).toBe('이 주차에 내 노트가 없어요. 먼저 마리를 가르쳐 주세요.')
  })

  it('서버가 보낸 message 는 화면에 쓰지 않는다', () => {
    const error = new ApiError(400, { code: 'INVALID_INPUT', message: 'SQL error near x' })
    expect(getErrorMessage(error)).not.toContain('SQL')
  })

  it('모르는 코드는 일반 문구, 5xx 는 서버 문제 문구를 돌려준다', () => {
    expect(getErrorMessage(new ApiError(400, { code: 'SOMETHING_NEW' }))).toContain(
      '요청을 처리하지 못했어요',
    )
    expect(getErrorMessage(new ApiError(503, { code: 'SOMETHING_NEW' }))).toBe(
      ERROR_MESSAGES.INTERNAL_ERROR,
    )
  })

  it('ApiError 가 아니면 기본 문구(또는 넘겨 준 문구)를 돌려준다', () => {
    expect(getErrorMessage(new Error('boom'))).toContain('요청을 처리하지 못했어요')
    expect(getErrorMessage('x', '직접 정한 문구')).toBe('직접 정한 문구')
  })
})

describe('오류 종류 확인', () => {
  it('서버에 닿지 못한 오류를 알아본다', () => {
    expect(isNetworkError(new ApiError(0, { code: NETWORK_ERROR_CODE }))).toBe(true)
    expect(isNetworkError(new ApiError(500, { code: 'INTERNAL_ERROR' }))).toBe(false)
  })

  it('코드로 분기한다', () => {
    const error = new ApiError(409, { code: 'COURSE_DUPLICATE' })
    expect(hasErrorCode(error, 'COURSE_DUPLICATE')).toBe(true)
    expect(hasErrorCode(error, 'UNIT_DUPLICATE')).toBe(false)
    expect(hasErrorCode(new Error('x'), 'COURSE_DUPLICATE')).toBe(false)
  })
})
