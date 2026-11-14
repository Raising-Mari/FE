import { academicTerm } from './academicTerm'

it('한국 시간으로 학기가 바뀌는 경계를 처리한다', () => {
  expect(academicTerm(new Date('2026-06-30T14:59:59Z'))).toBe('2026-1')
  expect(academicTerm(new Date('2026-06-30T15:00:00Z'))).toBe('2026-2')
  expect(academicTerm(new Date('2026-12-31T15:00:00Z'))).toBe('2027-1')
})
