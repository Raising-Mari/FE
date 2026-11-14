import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { courseKeys } from '@/hooks/useCourseQueries'
import { POLL_INTERVAL_MS } from '@/hooks/useStatusPolling'
import {
  deleteMaterial,
  fetchMaterial,
  fetchMaterials,
  updateMaterialUnits,
  uploadFile,
  uploadText,
  type MaterialSummary,
} from '../api'

export const materialKeys = {
  list: (courseId: number) => ['materials', courseId] as const,
  detail: (materialId: number) => ['materials', 'detail', materialId] as const,
}

const inProgress = (m: MaterialSummary) => m.status === 'PENDING' || m.status === 'PROCESSING'

/** 자료 목록. 처리 중인 자료가 있는 동안만 2.5초마다 다시 받아 상태를 따라간다. */
export function useMaterials(courseId: number) {
  return useQuery({
    queryKey: materialKeys.list(courseId),
    queryFn: () => fetchMaterials(courseId),
    enabled: courseId > 0,
    refetchInterval: (query) => (query.state.data?.some(inProgress) ? POLL_INTERVAL_MS : false),
  })
}

/** 실패한 자료의 이유(M-03). 목록에는 이유가 없어서 실패한 것만 따로 묻는다. */
export function useMaterialDetail(materialId: number, enabled: boolean) {
  return useQuery({
    queryKey: materialKeys.detail(materialId),
    queryFn: () => fetchMaterial(materialId),
    enabled,
    staleTime: Infinity,
  })
}

export function useUploadMaterial(courseId: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { title: string; file: File | null; text: string }) =>
      input.file
        ? uploadFile(courseId, input.title, input.file)
        : uploadText(courseId, input.title, input.text),
    onSuccess: () => void client.invalidateQueries({ queryKey: materialKeys.list(courseId) }),
  })
}

export function useUpdateMaterialUnits(courseId: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { materialId: number; unitIds: number[] }) =>
      updateMaterialUnits(input.materialId, input.unitIds),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: materialKeys.list(courseId) })
      // 주차의 자료 수·배틀 가능 여부가 바뀐다.
      void client.invalidateQueries({ queryKey: courseKeys.units(courseId) })
    },
  })
}

export function useDeleteMaterial(courseId: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (materialId: number) => deleteMaterial(materialId),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: materialKeys.list(courseId) })
      void client.invalidateQueries({ queryKey: courseKeys.units(courseId) })
    },
  })
}
