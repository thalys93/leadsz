import api from "@/services/api"

export async function sendLeadEmail(
  leadId: string,
  payload: { subject: string; body: string; to?: string }
) {
  const { data } = await api.post(`leads/${leadId}/emails/send`, payload)
  return data
}
