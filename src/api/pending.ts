/**
 * TODO(BE): 서버에 아직 없는 API. (루트 `BE_변경_요청서.md` B절)
 *
 * 2026-11-14 기준 남은 것: T-04 `GET /api/disciples/{id}/notes/{entryId}/history`(노트 이력),
 * M-05 `DELETE /api/materials/{id}`(자료 삭제), R-10 `GET /api/me/review-records`(복기 기록 모아 보기).
 * T-05·R-06·R-07·R-08 은 서버에 올라와 `generated` 타입을 쓴다.
 *
 * 명세(`api-spec.md`)에 응답 모양이 없는 것은 여기서 지어내지 않는다. 화면은 서버가 404·405 를 주면
 * "아직 지원하지 않아요"로 안내한다(`isNotSupported`).
 */
import { ApiError } from './errors'

/** 서버에 경로 자체가 없을 때의 응답인가. 미구현 API 를 부른 화면이 안내 문구를 고를 때 쓴다. */
export function isNotSupported(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 405)
}

export const NOT_SUPPORTED_MESSAGE = '아직 지원하지 않는 기능이에요. 곧 준비할게요.'
