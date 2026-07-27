import { formatCurrencyBRL } from "@/lib/crm"
import {
  PRICE_ANCHOR_CLASSNAMES,
  resolveDealPriceAnchor,
  type PriceAnchors,
} from "@/lib/deal-price-anchor"
import { cn } from "@/lib/utils"

type Props = {
  dealValue: number | string | null | undefined
  anchors?: PriceAnchors | null
  className?: string
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export function DealValueDisplay({ dealValue, anchors, className }: Props) {
  const value = toNumber(dealValue)
  const { tone, discountPercent } = resolveDealPriceAnchor(value, anchors)

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1.5 tabular-nums",
        tone ? PRICE_ANCHOR_CLASSNAMES[tone] : undefined,
        className
      )}
    >
      <span>{formatCurrencyBRL(value)}</span>
      {discountPercent != null && discountPercent > 0 ? (
        <span className="text-xs font-semibold">−{discountPercent}%</span>
      ) : null}
    </span>
  )
}
