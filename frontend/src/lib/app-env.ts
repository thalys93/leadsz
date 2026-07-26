export type LocalEnvBadge = "dev" | "prod"

export function getLocalEnvBadge(): LocalEnvBadge | null {
  const host = window.location.hostname
  if (host !== "localhost" && host !== "127.0.0.1") return null
  return import.meta.env.VITE_APP_ENV === "production" ? "prod" : "dev"
}
