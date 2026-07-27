import {
  resolveDealPriceAnchor,
  type PriceAnchors,
} from "./deal-price-anchor"

function assert(condition: boolean, label: string) {
  if (!condition) {
    throw new Error(`deal-price-anchor self-check failed: ${label}`)
  }
}

const anchors: PriceAnchors = {
  minPrice: 1000,
  idealPrice: 2000,
  maxPrice: 3000,
}

assert(
  resolveDealPriceAnchor(1800, anchors).tone === "below",
  "abaixo do ideal"
)
assert(
  resolveDealPriceAnchor(1800, anchors).discountPercent === 10,
  "desconto 10%"
)
assert(
  resolveDealPriceAnchor(2000, anchors).tone === "ideal",
  "igual ao ideal"
)
assert(
  resolveDealPriceAnchor(2500, anchors).tone === "ideal",
  "entre ideal e max"
)
assert(
  resolveDealPriceAnchor(3000, anchors).tone === "max",
  "no máximo"
)
assert(
  resolveDealPriceAnchor(3500, anchors).tone === "max",
  "acima do máximo"
)
assert(
  resolveDealPriceAnchor(null, anchors).tone === null,
  "sem valor"
)
assert(
  resolveDealPriceAnchor(2000, null).tone === null,
  "sem âncoras"
)

console.log("deal-price-anchor self-check ok")
