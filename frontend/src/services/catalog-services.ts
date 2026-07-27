import api from "@/services/api"
import type {
  CatalogService,
  CatalogServiceFilter,
  CatalogServicePayload,
} from "@/types/service"

export async function listServices(active: CatalogServiceFilter = "all") {
  const { data } = await api.get<CatalogService[]>("services", {
    params: active === "all" ? undefined : { active },
  })
  return data
}

export async function getService(id: string) {
  const { data } = await api.get<CatalogService>(`services/${id}`)
  return data
}

export async function createService(payload: CatalogServicePayload) {
  const { data } = await api.post<CatalogService>("services", payload)
  return data
}

export async function updateService(
  id: string,
  payload: Partial<CatalogServicePayload>
) {
  const { data } = await api.patch<CatalogService>(`services/${id}`, payload)
  return data
}

export async function deactivateService(id: string) {
  const { data } = await api.delete<{ message: string; serviceId: string }>(
    `services/${id}`
  )
  return data
}
