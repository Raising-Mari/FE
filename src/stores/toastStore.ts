import { create } from 'zustand'

export interface ToastItem {
  id: number
  kind: 'info' | 'error'
  message: string
}

/** 한 번에 보이는 알림 수. 넘치면 가장 오래된 것부터 지운다. */
export const MAX_TOASTS = 3

interface ToastState {
  toasts: ToastItem[]
  show: (kind: ToastItem['kind'], message: string) => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (kind, message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: nextId++, kind, message }].slice(-MAX_TOASTS),
    })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

/** 어디서든 부르는 짧은 알림. 훅이 아니라서 이벤트 핸들러·mutation 콜백 안에서 바로 쓴다. */
export const toast = {
  info: (message: string) => useToastStore.getState().show('info', message),
  error: (message: string) => useToastStore.getState().show('error', message),
}
