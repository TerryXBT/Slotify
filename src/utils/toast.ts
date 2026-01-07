import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message, {
      duration: 3000,
      position: 'top-center',
    })
  },

  error: (message: string) => {
    sonnerToast.error(message, {
      duration: 4000,
      position: 'top-center',
    })
  },

  loading: (message: string) => {
    return sonnerToast.loading(message, {
      position: 'top-center',
    })
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
      position: 'top-center',
    })
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  },
}
