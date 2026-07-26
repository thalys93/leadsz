import type { ReactNode } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

function PublicLayout({
  children,
  fullBleed = false,
}: {
  children: ReactNode
  fullBleed?: boolean
}) {
  return (
    <main
      className={cn(
        "min-h-screen overflow-x-hidden bg-background",
        fullBleed ? "relative p-0" : "px-4 py-8 sm:px-6 sm:py-12"
      )}
    >
      <div
        className={cn(
          "z-50 flex justify-end",
          fullBleed ? "absolute right-4 top-4 sm:right-6 sm:top-6" : "pb-2"
        )}
      >
        <ThemeToggle />
      </div>
      {children}
    </main>
  )
}

export default PublicLayout
