import { RouterProvider } from 'react-router'
import { Providers } from './providers'
import { router } from './router'
import { ToastViewport } from './ToastViewport'

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
      <ToastViewport />
    </Providers>
  )
}
