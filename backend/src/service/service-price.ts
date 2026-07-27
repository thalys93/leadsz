export function pricesAreOrdered(
  minPrice: number | null | undefined,
  idealPrice: number | null | undefined,
  maxPrice: number | null | undefined,
): boolean {
  if (minPrice == null || idealPrice == null || maxPrice == null) return true;
  return minPrice <= idealPrice && idealPrice <= maxPrice;
}

export function toPriceString(
  value: number | null | undefined,
): string | null {
  if (value == null) return null;
  return String(value);
}

export function parsePrice(value: string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
