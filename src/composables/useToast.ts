import { useToast as useVueToast } from 'vue-toastification'
import type { ToastInterface } from 'vue-toastification'

export interface ToastOptions {
  timeout?: number
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left'
  closeOnClick?: boolean
  pauseOnFocusLoss?: boolean
  pauseOnHover?: boolean
  draggable?: boolean
  draggablePercent?: number
  showCloseButtonOnHover?: boolean
  hideProgressBar?: boolean
  closeButton?: boolean | 'button' | 'icon'
  icon?: boolean | string
  rtl?: boolean
  className?: string
}

export function useToast() {
  const toast: ToastInterface = useVueToast()

  const success = (message: string, options?: ToastOptions) => {
    return toast.success(message, options)
  }

  const error = (message: string, options?: ToastOptions) => {
    return toast.error(message, options)
  }

  const warning = (message: string, options?: ToastOptions) => {
    return toast.warning(message, options)
  }

  const info = (message: string, options?: ToastOptions) => {
    return toast.info(message, options)
  }

  const clear = () => {
    toast.clear()
  }

  const dismiss = (id: string | number) => {
    toast.dismiss(id)
  }

  return {
    toast,
    success,
    error,
    warning,
    info,
    clear,
    dismiss
  }
}
