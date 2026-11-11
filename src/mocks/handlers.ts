import { http, HttpResponse } from 'msw'
import { MOCK_ME } from './fixtures'
import { useScenario } from './scenario'

/** BE 의 `ErrorResponse` 와 같은 모양으로 오류를 만든다. 문구는 FE 가 코드로 만들어 쓰므로 `message` 는 참고용이다. */
function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status })
}

/**
 * BE 없이 화면을 만들 때 쓰는 가짜 응답. BE 의 API 명세(Swagger)와 같은 경로·모양으로 맞춘다.
 * 새 API 를 쓰는 화면을 만들면 여기에 핸들러를 같이 추가한다.
 */
export const handlers = [
  // 시연 도구의 "서버 끊김"·"로그인 만료"를 모든 API 에 한꺼번에 적용한다(로그인 만료는 한 번만). 값을 돌려주지 않으면 다음 핸들러로 넘어간다.
  http.all('/api/*', ({ request }) => {
    const { networkDown, tokenRejected, set } = useScenario.getState()
    if (networkDown) return HttpResponse.error()
    if (tokenRejected && request.headers.has('Authorization')) {
      set({ tokenRejected: false }) // 한 번만 거절한다. 다시 로그인하면 정상으로 돌아와야 하기 때문이다.
      return errorResponse(401, 'UNAUTHORIZED', '로그인이 필요합니다.')
    }
  }),

  http.get('/api/health', () =>
    HttpResponse.json({ status: 'ok', serverTime: new Date().toISOString() }),
  ),

  // A-06 내 정보
  http.get('/api/me', ({ request }) => {
    if (!request.headers.has('Authorization')) {
      return errorResponse(401, 'UNAUTHORIZED', '로그인이 필요합니다.')
    }
    return HttpResponse.json({ ...MOCK_ME, role: useScenario.getState().role })
  }),
]
