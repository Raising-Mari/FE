import { http, HttpResponse } from 'msw'
import type { components } from '@/api/generated/schema'
import { mockUnits } from './courseData'

type Schemas = components['schemas']
type MockMaterial = Schemas['MaterialResponse'] & { courseId: number; createdAt: string }

/** 목업 자료. 접수 뒤 목록을 두 번 받으면 처리 완료가 되도록 흉내 낸다(실제 서버는 따로 처리한다). */
export const mockMaterials: MockMaterial[] = []
let nextId = 1

export function resetMaterialData() {
  nextId = 2
  mockMaterials.splice(0, mockMaterials.length, {
    id: 1,
    courseId: 1,
    title: '스택과 큐 · 시연 공개 예문',
    status: 'DONE',
    sentenceCount: 24,
    unitIds: [1],
    createdAt: '2026-11-07T11:00:00Z',
  })
}
resetMaterialData()

const error = (status: number, code: string) => HttpResponse.json({ code, message: '' }, { status })

function accept(courseId: number, title: string, text: string | null) {
  // 붙여넣은 글이 30자 미만이면 서버처럼 처리 단계에서 실패한다.
  const tooShort = text !== null && text.replace(/\s/g, '').length < 30
  const material: MockMaterial = {
    id: nextId++,
    courseId,
    title,
    status: 'PENDING',
    sentenceCount: 0,
    unitIds: [],
    createdAt: new Date().toISOString(),
    ...(tooShort ? { failReason: 'NO_TEXT' as const } : {}),
  }
  mockMaterials.unshift(material)
  return HttpResponse.json(
    { materialId: material.id, status: 'PENDING' } satisfies Schemas['MaterialAcceptedResponse'],
    { status: 202 },
  )
}

/** 목록을 받을 때마다 처리 단계를 한 칸 진행한다. */
function advance(material: MockMaterial) {
  if (material.status === 'PENDING') material.status = 'PROCESSING'
  else if (material.status === 'PROCESSING') {
    material.status = material.failReason ? 'FAILED' : 'DONE'
    if (!material.failReason) material.sentenceCount = 12
  }
}

export const materialHandlers = [
  http.get('/api/courses/:courseId/materials', ({ params }) => {
    const courseId = Number(params.courseId)
    const list = mockMaterials.filter((m) => m.courseId === courseId)
    const body = list.map(
      (m) =>
        ({
          id: m.id,
          title: m.title,
          status: m.status,
          createdAt: m.createdAt,
          unitIds: m.unitIds,
        }) satisfies Schemas['MaterialSummaryResponse'],
    )
    list.forEach(advance)
    return HttpResponse.json(body)
  }),

  http.post('/api/courses/:courseId/materials/text', async ({ request, params }) => {
    const input = (await request.json()) as Schemas['CreateTextMaterialRequest']
    if (!input.consentAgreed) return error(400, 'MATERIAL_CONSENT_REQUIRED')
    if (input.text.length > 100_000) return error(413, 'MATERIAL_TOO_LARGE')
    return accept(Number(params.courseId), input.title, input.text)
  }),

  http.post('/api/courses/:courseId/materials/file', ({ request, params }) => {
    const url = new URL(request.url)
    if (url.searchParams.get('consentAgreed') !== 'true')
      return error(400, 'MATERIAL_CONSENT_REQUIRED')
    return accept(Number(params.courseId), url.searchParams.get('title') ?? '', null)
  }),

  http.get('/api/materials/:materialId', ({ params }) => {
    const material = mockMaterials.find((m) => m.id === Number(params.materialId))
    if (!material) return error(404, 'NOT_FOUND')
    const { courseId: _courseId, createdAt: _createdAt, ...body } = material
    return HttpResponse.json(body satisfies Schemas['MaterialResponse'])
  }),

  http.put('/api/materials/:materialId/units', async ({ request, params }) => {
    const material = mockMaterials.find((m) => m.id === Number(params.materialId))
    if (!material) return error(404, 'NOT_FOUND')
    const { unitIds } = (await request.json()) as Schemas['UpdateMaterialUnitsRequest']
    const courseUnits = (mockUnits.get(material.courseId) ?? []).map((unit) => unit.id)
    if (unitIds.some((id) => !courseUnits.includes(id))) return error(400, 'UNIT_NOT_IN_COURSE')
    material.unitIds = [...new Set(unitIds)].sort((a, b) => a - b)
    return HttpResponse.json({
      materialId: material.id,
      unitIds: material.unitIds,
    } satisfies Schemas['MaterialUnitsResponse'])
  }),

  // M-05 는 서버에 아직 없다(api/pending.ts). 목업은 명세대로 동작한다.
  http.delete('/api/materials/:materialId', ({ params }) => {
    const index = mockMaterials.findIndex((m) => m.id === Number(params.materialId))
    if (index < 0) return error(404, 'NOT_FOUND')
    mockMaterials.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
