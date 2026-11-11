import { useEffect } from 'react'
import { Toast } from '@/components/ui/Toast'
import { useToastStore, type ToastItem } from '@/stores/toastStore'

/** 알림이 떠 있는 시간(시안 26: 4초). */
export const TOAST_DURATION_MS = 4000

function AutoDismissToast({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss)

  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [dismiss, item.id])

  return <Toast kind={item.kind} message={item.message} onClose={() => dismiss(item.id)} />
}

/** 화면 오른쪽 아래에 알림을 쌓는다. 앱에 한 번만 둔다(`App.tsx`). */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div className="pointer-events-none fixed right-8 bottom-8 z-[60] flex flex-col gap-3">
      {toasts.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <AutoDismissToast item={item} />
        </div>
      ))}
    </div>
  )
}
