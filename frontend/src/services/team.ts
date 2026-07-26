import api from "@/services/api"

export type Invitation = {
  id: string
  email: string
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED"
  role: "ADMIN" | "MEMBER"
  expiresAt: string
  createdAt: string
}

export async function listInvitations() {
  const { data } = await api.get<Invitation[]>("invitations")
  return data
}

export async function createInvitation(email: string) {
  const { data } = await api.post<Invitation>("invitations", { email })
  return data
}

export async function resendInvitation(id: string) {
  const { data } = await api.post<Invitation>(`invitations/${id}/resend`)
  return data
}

export async function revokeInvitation(id: string) {
  const { data } = await api.post<Invitation>(`invitations/${id}/revoke`)
  return data
}
