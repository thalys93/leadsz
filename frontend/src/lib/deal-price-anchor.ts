import { parseCatalogPrice } from "@/types/service"

export type PriceAnchorTone = "below" | "ideal" | "max"

export type PriceAnchors = {
  minPrice?: string | number | null
  idealPrice?: string | number | null
  maxPrice?: string | number | null
}

export type DealPriceAnchor = {
  tone: PriceAnchorTone | null
  discountPercent: number | null
}

export function resolveDealPriceAnchor(
  dealValue: number | null | undefined,
  anchors: PriceAnchors | null | undefined
): DealPriceAnchor {
  if (dealValue == null || !Number.isFinite(dealValue) || !anchors) {
    return { tone: null, discountPercent: null }
  }

  const ideal = parseCatalogPrice(anchors.idealPrice)
  const max = parseCatalogPrice(anchors.maxPrice)

  if (max != null && dealValue >= max) {
    return { tone: "max", discountPercent: null }
  }

  if (ideal == null) {
    return { tone: null, discountPercent: null }
  }

  if (dealValue < ideal) {
    const discountPercent = Math.round((1 - dealValue / ideal) * 100)
    return { tone: "below", discountPercent: Math.max(0, discountPercent) }
  }

  return { tone: "ideal", discountPercent: null }
}

export const PRICE_ANCHOR_CLASSNAMES: Record<PriceAnchorTone, string> = {
  below: "text-amber-600 dark:text-amber-400",
  ideal: "text-emerald-600 dark:text-emerald-400",
  max: "text-blue-600 dark:text-blue-400",
}
