/** 조건부 클래스 이름을 한 줄로 합친다. Tailwind 클래스끼리 덮어쓰지 않도록 겹치는 클래스는 넣지 않는다. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
