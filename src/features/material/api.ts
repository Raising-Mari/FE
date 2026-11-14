import { apiClient } from '@/api/client'
import type { components } from '@/api/generated/schema'

type Schemas = components['schemas']
export type MaterialSummary = Schemas['MaterialSummaryResponse']
export type Material = Schemas['MaterialResponse']
export type MaterialStatus = NonNullable<MaterialSummary['status']>
export type MaterialFailReason = NonNullable<Material['failReason']>

/** 서버 기준과 같은 값(M-01·M-02). 서버가 다시 검사하지만 올리기 전에 먼저 알려 준다. */
export const MAX_PDF_BYTES = 20 * 1024 * 1024
export const MAX_TEXT_LENGTH = 100_000
export const MAX_TITLE_LENGTH = 200

/** M-04 이 과목에 내가 올린 자료(최근 순). */
export async function fetchMaterials(courseId: number): Promise<MaterialSummary[]> {
  const { data } = await apiClient.get<MaterialSummary[]>(`/api/courses/${courseId}/materials`)
  return data
}

/** M-03 처리 상태와 실패 이유. */
export async function fetchMaterial(materialId: number): Promise<Material> {
  const { data } = await apiClient.get<Material>(`/api/materials/${materialId}`)
  return data
}

/** M-02 글을 붙여넣어 올린다. 접수만 하고(202) 처리는 서버가 따로 한다. */
export async function uploadText(courseId: number, title: string, text: string) {
  const { data } = await apiClient.post<Schemas['MaterialAcceptedResponse']>(
    `/api/courses/${courseId}/materials/text`,
    { title, text, consentAgreed: true } satisfies Schemas['CreateTextMaterialRequest'],
  )
  return data
}

/** M-01 PDF 를 올린다. 제목·동의는 Swagger 대로 쿼리로, 파일은 multipart 로 보낸다. */
export async function uploadFile(courseId: number, title: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<Schemas['MaterialAcceptedResponse']>(
    `/api/courses/${courseId}/materials/file`,
    form,
    { params: { title, consentAgreed: true } },
  )
  return data
}

/** M-06 이 자료가 출처가 될 주차를 통째로 바꾼다. 빈 배열이면 모두 푼다. */
export async function updateMaterialUnits(materialId: number, unitIds: number[]) {
  const { data } = await apiClient.put<Schemas['MaterialUnitsResponse']>(
    `/api/materials/${materialId}/units`,
    { unitIds } satisfies Schemas['UpdateMaterialUnitsRequest'],
  )
  return data
}

/** M-05 자료 삭제. TODO(BE): 서버에 아직 없다(`api/pending.ts`). 없으면 화면이 "아직 지원하지 않아요"로 안내한다. */
export async function deleteMaterial(materialId: number): Promise<void> {
  await apiClient.delete(`/api/materials/${materialId}`)
}
