import { cn } from "@/lib/utils"

type BrandLogoVariant = "mark" | "wordmark" | "lockup"

type BrandLogoProps = {
  variant?: BrandLogoVariant
  className?: string
  alt?: string
}

const MARK_LIGHT = "/brand/app-icon-light.png"
const MARK_DARK = "/brand/app-icon.png"
const WORDMARK_LIGHT = "/brand/workdmark.png"
const WORDMARK_DARK = "/brand/wordmark-dark.png"
const LOCKUP_LIGHT = "/brand/primary-lockup.png"
const LOCKUP_DARK = "/brand/primary-lockup-dark.png"

export function BrandLogo({
  variant = "lockup",
  className,
  alt = "Leadz",
}: BrandLogoProps) {
  if (variant === "mark") {
    return (
      <span
        className={cn("inline-flex shrink-0", className)}
        role="img"
        aria-label={alt}
      >
        <img
          src={MARK_LIGHT}
          alt=""
          className="size-full object-contain dark:hidden"
        />
        <img
          src={MARK_DARK}
          alt=""
          className="hidden size-full object-contain dark:block"
        />
      </span>
    )
  }

  const light = variant === "wordmark" ? WORDMARK_LIGHT : LOCKUP_LIGHT
  const dark = variant === "wordmark" ? WORDMARK_DARK : LOCKUP_DARK

  return (
    <span
      className={cn("inline-flex items-center", className)}
      role="img"
      aria-label={alt}
    >
      <img
        src={light}
        alt=""
        className="h-full w-auto object-contain dark:hidden"
      />
      <img
        src={dark}
        alt=""
        className="hidden h-full w-auto object-contain dark:block"
      />
    </span>
  )
}
