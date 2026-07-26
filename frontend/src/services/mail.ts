import api from "@/services/api"

export type TestMailTemplate = "welcome" | "password-reset" | "notification"

export type SendTestMailPayload = {
  to: string
  template: TestMailTemplate
  code?: string
  title?: string
  message?: string
}

export async function sendTestMail(payload: SendTestMailPayload) {
  const { data } = await api.post<{ message: string }>("mail/test", payload)
  return data
}
