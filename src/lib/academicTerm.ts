/** 학기는 한국 시간의 현재 날짜를 기준으로 1~6월/7~12월을 나눈다. */
export function academicTerm(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  return `${year}-${month <= 6 ? 1 : 2}`
}
