export function userInitials(name?: string | null) {
  if (!name?.trim()) return "?"
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("")
}
