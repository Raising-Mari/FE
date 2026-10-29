import { http, HttpResponse } from 'msw'

/**
 * BE 없이 화면을 만들 때 쓰는 가짜 응답. BE 의 API 명세(Swagger)와 같은 경로·모양으로 맞춘다.
 * 새 API 를 쓰는 화면을 만들면 여기에 핸들러를 같이 추가한다.
 */
export const handlers = [
  http.get('/api/health', () =>
    HttpResponse.json({ status: 'ok', serverTime: new Date().toISOString() }),
  ),
]
