import { http, HttpResponse } from 'msw'
import { MOCK_ME } from './fixtures'
import { useScenario } from './scenario'
import type { components } from '@/api/generated/schema'
import { mockCourses, mockDisciples, mockUnits, mockNickname, setMockNickname } from './courseData'

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
    return HttpResponse.json({
      ...MOCK_ME,
      nickname: mockNickname,
      role: useScenario.getState().role,
    })
  }),

  http.post('/api/auth/google', async ({ request }) => {
    const { idToken } = (await request.json()) as components['schemas']['GoogleLoginRequest']
    if (idToken === 'mock-wrong-domain')
      return errorResponse(403, 'AUTH_EMAIL_DOMAIN_NOT_ALLOWED', '')
    if (idToken === 'mock-invalid') return errorResponse(401, 'AUTH_GOOGLE_TOKEN_INVALID', '')
    if (idToken === 'mock-new')
      return HttpResponse.json({
        registered: false,
        signupToken: 'mock-signup-token',
        profile: { emailMasked: 's***@mju.ac.kr' },
      } satisfies components['schemas']['GoogleLoginResponse'])
    return HttpResponse.json({
      registered: true,
      accessToken: 'mock-access-token',
      user: { id: 1, nickname: mockNickname, role: useScenario.getState().role },
    } satisfies components['schemas']['GoogleLoginResponse'])
  }),
  http.get('/api/departments', () =>
    HttpResponse.json([
      { id: 1, name: '컴퓨터공학과', collegeName: 'ICT융합대학' },
      { id: 2, name: '경영학과', collegeName: '경영대학' },
    ] satisfies components['schemas']['DepartmentResponse'][]),
  ),
  http.get('/api/auth/nicknames/availability', ({ request }) => {
    const nickname = new URL(request.url).searchParams.get('nickname') ?? ''
    if (!/^[가-힣a-zA-Z0-9_]{2,12}$/.test(nickname))
      return errorResponse(400, 'AUTH_NICKNAME_INVALID', '')
    return HttpResponse.json({ available: nickname !== '사용중' })
  }),
  http.post('/api/auth/signup', async ({ request }) => {
    const input = (await request.json()) as components['schemas']['SignupRequest']
    if (input.signupToken !== 'mock-signup-token')
      return errorResponse(401, 'AUTH_SIGNUP_TOKEN_INVALID', '')
    if (!input.agreedTerms) return errorResponse(400, 'AUTH_TERMS_REQUIRED', '')
    if (input.nickname === '사용중') return errorResponse(409, 'AUTH_NICKNAME_TAKEN', '')
    if (!/^[가-힣a-zA-Z0-9_]{2,12}$/.test(input.nickname))
      return errorResponse(400, 'AUTH_NICKNAME_INVALID', '')
    setMockNickname(input.nickname)
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      user: { id: 1, nickname: input.nickname, role: 'STUDENT' },
    } satisfies components['schemas']['SignupResponse'])
  }),
  http.get('/api/me/courses', () =>
    HttpResponse.json(
      mockCourses
        .filter((course) => mockDisciples.has(course.id!))
        .map((course) => ({
          ...course,
          disciple: mockDisciples.get(course.id!),
        })) satisfies components['schemas']['MyCourseResponse'][],
    ),
  ),
  http.get('/api/me/ratings', () =>
    HttpResponse.json(
      mockCourses
        .filter((course) => mockDisciples.has(course.id!))
        .map((course) => ({
          course: { id: course.id, name: course.name },
          rating: 1000,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
        })) satisfies components['schemas']['MyRatingResponse'][],
    ),
  ),
  http.get('/api/courses', ({ request }) => {
    const url = new URL(request.url)
    const keyword = url.searchParams.get('keyword') ?? ''
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 10)
    const all = mockCourses.filter((course) => course.name?.includes(keyword))
    return HttpResponse.json({
      items: all.slice(page * size, (page + 1) * size),
      page,
      size,
      totalElements: all.length,
      hasNext: all.length > (page + 1) * size,
    } satisfies components['schemas']['PageResponseCourseResponse'])
  }),
  http.post('/api/courses', async ({ request }) => {
    const input = (await request.json()) as components['schemas']['CreateCourseRequest']
    const existing = mockCourses.find(
      (course) => course.name === input.name && course.term === input.term,
    )
    if (existing)
      return HttpResponse.json(
        { code: 'COURSE_DUPLICATE', details: { existingCourseId: existing.id } },
        { status: 409 },
      )
    const course = {
      ...input,
      id: Math.max(0, ...mockCourses.map((item) => item.id ?? 0)) + 1,
      hasMyDisciple: false,
    }
    mockCourses.push(course)
    return HttpResponse.json(course, { status: 201 })
  }),
  http.get('/api/courses/:courseId', ({ params }) => {
    const course = mockCourses.find((item) => item.id === Number(params.courseId))
    return course
      ? HttpResponse.json({ ...course, hasMyDisciple: mockDisciples.has(course.id!) })
      : errorResponse(404, 'NOT_FOUND', '')
  }),
  http.get('/api/courses/:courseId/disciple', ({ params }) => {
    const disciple = mockDisciples.get(Number(params.courseId))
    return disciple ? HttpResponse.json(disciple) : errorResponse(404, 'DISCIPLE_NOT_FOUND', '')
  }),
  http.post('/api/courses/:courseId/disciple', async ({ request, params }) => {
    const courseId = Number(params.courseId)
    if (!mockCourses.some((course) => course.id === courseId))
      return errorResponse(404, 'NOT_FOUND', '')
    if (mockDisciples.has(courseId)) return errorResponse(409, 'DISCIPLE_ALREADY_EXISTS', '')
    const input = (await request.json()) as components['schemas']['CreateDiscipleRequest']
    const disciple = { ...input, id: courseId, courseId, createdAt: new Date().toISOString() }
    mockDisciples.set(courseId, disciple)
    return HttpResponse.json(disciple, { status: 201 })
  }),
  http.get('/api/courses/:courseId/units', ({ params }) =>
    HttpResponse.json(mockUnits.get(Number(params.courseId)) ?? []),
  ),
  http.post('/api/courses/:courseId/units', async ({ request, params }) => {
    const courseId = Number(params.courseId)
    const input = (await request.json()) as components['schemas']['CreateUnitRequest']
    const units = mockUnits.get(courseId) ?? []
    const existing = units.find((unit) => unit.title === input.title)
    if (existing)
      return HttpResponse.json(
        { code: 'UNIT_DUPLICATE', details: { existingUnitId: existing.id } },
        { status: 409 },
      )
    const id =
      Math.max(
        0,
        ...Array.from(mockUnits.values())
          .flat()
          .map((unit) => unit.id ?? 0),
      ) + 1
    const unit = { id, title: input.title, myNoteCount: 0, materialCount: 0, battleReady: false }
    units.push(unit)
    mockUnits.set(courseId, units)
    return HttpResponse.json(unit, { status: 201 })
  }),
]
