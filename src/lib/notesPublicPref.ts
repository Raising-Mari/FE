/**
 * 노트 공개 동의 체크 값을 준비 완료 때까지 기억한다. 서버는 방 만들기·입장 요청에서 이 값을 받지 않고
 * 준비 완료(B-04)의 첫 호출에서만 받기 때문이다. 이 탭에서만 필요한 값이라 sessionStorage 에 둔다.
 */
const key = (battleId: number) => `mari.battle.${battleId}.notesPublic`

export function rememberNotesPublic(battleId: number, value: boolean) {
  try {
    sessionStorage.setItem(key(battleId), value ? '1' : '0')
  } catch {
    // 저장하지 못해도 대기실에서 다시 고를 수 있다.
  }
}

/** 기억한 값이 없으면 동의하지 않은 것으로 본다. */
export function recallNotesPublic(battleId: number): boolean {
  try {
    return sessionStorage.getItem(key(battleId)) === '1'
  } catch {
    return false
  }
}
