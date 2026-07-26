import api from "@/services/api"
import type { DashboardSummary } from "@/types/dashboard"

export async function getDashboardSummary() {
  const { data } = await api.get<DashboardSummary>("dashboard/summary")
  return data
}
