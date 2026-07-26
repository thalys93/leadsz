import api from "@/services/api"
import type { AuthUser } from "@/store/use-auth-store"

type AuthResponse = {
  token: string
  userData: AuthUser
}

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<AuthResponse>("auth/login", {
    email,
    password,
  })
  return data
}

export async function registerRequest(payload: {
  name: string
  email: string
  password: string
  companyName: string
}) {
  const { data } = await api.post<AuthResponse>("auth/register", payload)
  return data
}

export async function acceptInviteRequest(payload: {
  token: string
  name?: string
  password?: string
}) {
  const { data } = await api.post<AuthResponse>("invitations/accept", payload)
  return data
}

export async function updateMeRequest(payload: {
  name?: string
  jobTitle?: string | null
  phone?: string | null
  website?: string | null
  avatar_url?: string | null
}) {
  const { data } = await api.patch<{
    message: string
    user: {
      id: string
      email: string
      name: string
      avatar_url?: string | null
      jobTitle?: string | null
      phone?: string | null
      website?: string | null
      companyId?: string | null
      companyRole?: "ADMIN" | "MEMBER" | null
      roles?: { name: string }[]
    }
  }>("auth/users/update/me", payload)
  return data
}

export async function forgotPasswordRequest(email: string) {
  const { data } = await api.post<{ message: string }>("auth/password/forgot", {
    email,
  })
  return data
}

export async function verifyResetCodeRequest(email: string, code: string) {
  const { data } = await api.post<{ message: string }>("auth/password/verify", {
    email,
    code,
  })
  return data
}

export async function resetPasswordRequest(email: string, password: string) {
  const { data } = await api.post<{ message: string }>("auth/password/reset", {
    email,
    password,
  })
  return data
}
