import { makeFromState, readFromState } from './redirectState'

describe('redirectState', () => {
  it('주소·검색어·해시를 합쳐 돌아갈 주소로 만든다', () => {
    expect(makeFromState({ pathname: '/join/ABC123', search: '?a=1', hash: '#x' })).toEqual({
      from: '/join/ABC123?a=1#x',
    })
  })

  it('앱 안의 주소만 꺼낸다', () => {
    expect(readFromState({ from: '/courses/3/teach' })).toBe('/courses/3/teach')
  })

  it.each([
    ['없음', undefined],
    ['문자열', '/courses'],
    ['외부 주소', { from: 'https://evil.example' }],
    ['프로토콜 생략 주소', { from: '//evil.example' }],
    ['문자열이 아님', { from: 3 }],
  ])('%s 는 null 로 처리한다', (_label, state) => {
    expect(readFromState(state)).toBeNull()
  })
})
