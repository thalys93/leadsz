import { useTheme } from "next-themes"
import { useEffect } from "react"

const FAVICON_LIGHT = "/brand/app-icon-light.png"
const FAVICON_DARK = "/brand/app-icon.png"

function setFavicon(href: string) {
  document
    .querySelectorAll<HTMLLinkElement>("link[rel='icon'], link[rel='shortcut icon']")
    .forEach((link) => link.remove())

  const icon = document.createElement("link")
  icon.rel = "icon"
  icon.type = "image/png"
  icon.href = `${href}?v=leadz`
  document.head.appendChild(icon)

  const shortcut = document.createElement("link")
  shortcut.rel = "shortcut icon"
  shortcut.type = "image/png"
  shortcut.href = `${href}?v=leadz`
  document.head.appendChild(shortcut)
}

export function ThemeFavicon() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!resolvedTheme) return
    setFavicon(resolvedTheme === "dark" ? FAVICON_DARK : FAVICON_LIGHT)
  }, [resolvedTheme])

  return null
}
