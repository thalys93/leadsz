import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/use-auth-store"

export default function AppRedirectPage() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/" replace />
  return <Navigate to="/app/dashboard" replace />
}
