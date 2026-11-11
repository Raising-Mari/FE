/**
 * TODO(BE): 서버에 아직 없는 API의 요청·응답 모양. (루트 `BE_변경_요청서.md` B절)
 *
 * 없는 경로: T-04 `GET /api/disciples/{id}/notes/{entryId}/history`, T-05 `POST /api/disciples/{id}/notes/merge`,
 * M-05 `DELETE /api/materials/{id}`, R-06 `GET /api/battles/{id}/opponent-notes`,
 * R-07 `POST /api/battles/{id}/note-reviews`, R-08 `GET /api/battles/{id}/note-reviews`, R-10 `GET /api/me/review-records`.
 *
 * BE 명세(`api-spec.md`)에 모양이 정해진 것만 적는다. T-04·R-06·R-08·R-10의 응답과 R-07의 응답은 명세에 없으므로
 * 여기서 지어내지 않고, 서버가 올라오면 `generated` 타입을 쓴다. 서버에 올라오면 `npm run gen:api`로 타입을 다시 만들고
 * 이 파일의 해당 항목을 지운다.
 */

/** T-05 요청: 확인 카드에서 학생이 "합치기"를 골랐을 때. 두 노트는 같은 제자·같은 주차의 ACTIVE 여야 한다. */
export interface MergeNotesRequest {
  keepEntryId: number
  mergeEntryId: number
}

/** T-05 응답(200). 합쳐진 노트는 MERGED 가 되고 내용은 바뀌지 않는다. */
export interface MergeNotesResponse {
  keepEntryId: number
  mergedEntryId: number
}

/** R-07 요청. 배틀당 1회(REVIEW_ALREADY_SUBMITTED), 두 사람이 모두 공개에 동의한 배틀에서만. */
export interface CreateNoteReviewRequest {
  goodPoints: string
  suggestions: string
  evidenceNoteEntryId?: number
}
