import { formatDelta, formatKst, formatScore } from './datetime'

describe('datetime', () => {
  it('UTC 시각을 한국 시간으로 바꾼다', () => {
    expect(formatKst('2026-11-07T11:24:00Z')).toBe('11월 7일 오후 08:24')
  })
  it('값이 없거나 잘못되면 빈 문자열', () => {
    expect(formatKst(undefined)).toBe('')
    expect(formatKst('x')).toBe('')
  })
  it('점수와 변화량 표기', () => {
    expect(formatScore(0)).toBe('0.00')
    expect(formatScore(-0.5)).toBe('-0.50')
    expect(formatDelta(12)).toBe('+12')
    expect(formatDelta(-8)).toBe('-8')
    expect(formatDelta(undefined)).toBe('+0')
  })
})
