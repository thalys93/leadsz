export type CatalogService = {
  id: string
  companyId: string
  name: string
  translateKey: string | null
  icon: string | null
  minPrice: string | null
  idealPrice: string | null
  maxPrice: string | null
  scopeIn: string | null
  scopeOut: string | null
  typicalDeadline: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type CatalogServicePayload = {
  name: string
  translateKey?: string | null
  icon?: string | null
  minPrice?: number | null
  idealPrice?: number | null
  maxPrice?: number | null
  scopeIn?: string | null
  scopeOut?: string | null
  typicalDeadline?: string | null
  active?: boolean
}

export type CatalogServiceFilter = "true" | "false" | "all"

export function parseCatalogPrice(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined || value === "") return null
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : null
}
