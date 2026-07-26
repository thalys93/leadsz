import { Navigate, useLocation } from "react-router-dom"
import AppLayout from "@/layouts/app-layout"
import { useAuthStore } from "@/store/use-auth-store"

export default function PrivateShell({
  children,
}: {
  children: React.ReactNode
}) {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }

  return <AppLayout>{children}</AppLayout>
}
