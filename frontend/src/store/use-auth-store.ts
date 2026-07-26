import { create } from "zustand"
import { persist } from "zustand/middleware"

export type AuthUser = {
  id: string
  email: string
  name: string
  roles: string[]
  companyId: string | null
  companyRole: "ADMIN" | "MEMBER" | null
  avatar_url?: string | null
  jobTitle?: string | null
  phone?: string | null
  website?: string | null
}

type AuthState = {
  token: string | null
  user: AuthUser | null
  setSession: (token: string, user: AuthUser) => void
  updateUser: (user: Partial<AuthUser>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      updateUser: (patch) =>
        set((state) =>
          state.user ? { user: { ...state.user, ...patch } } : state
        ),
      logout: () => set({ token: null, user: null }),
    }),
    { name: "auth-storage" }
  )
)
