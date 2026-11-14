/** 서버 시각(UTC ISO 문자열)을 한국 시간으로 보여 준다. 화면에서 시각을 만드는 곳은 여기 하나다. */
const dateTime = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

/** 예: "11월 7일 오후 08:24". 값이 없거나 읽을 수 없으면 빈 문자열. */
export function formatKst(iso: string | undefined | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return dateTime.format(date)
}

/** 점수는 소수 둘째 자리까지 보여 준다(시안: 0.00). */
export function formatScore(value: number | undefined | null): string {
  return (value ?? 0).toFixed(2)
}

/** 변화량 앞에 부호를 붙인다. 예: +12, -8, +0 */
export function formatDelta(value: number | undefined | null): string {
  const n = value ?? 0
  return n >= 0 ? `+${n}` : `${n}`
}
