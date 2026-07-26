import { toast as sonnerToast } from "sonner"

export function showSuccess(message: string) {
  sonnerToast.success(message)
}

export function showError(message: string) {
  sonnerToast.error(message)
}

export function showLoading(message: string) {
  return sonnerToast.loading(message)
}

export function dismissToast(toastId: string) {
  sonnerToast.dismiss(toastId)
}
