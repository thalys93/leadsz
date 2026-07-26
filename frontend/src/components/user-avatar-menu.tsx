import { LogOut } from "lucide-react"
import { Link } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { userInitials } from "@/lib/user-initials"
import { useAuthStore } from "@/store/use-auth-store"
import { cn } from "@/lib/utils"

type UserAvatarMenuProps = {
  onLogout: () => void
  compact?: boolean
  className?: string
}

export function UserAvatarMenu({
  onLogout,
  compact = false,
  className,
}: UserAvatarMenuProps) {
  const user = useAuthStore((s) => s.user)

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <ThemeToggle />
        <Link
          to="/app/profile"
          className="rounded-full outline-none ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Editar perfil"
        >
          <Avatar className="size-9 border border-border">
            {user?.avatar_url ? (
              <AvatarImage src={user.avatar_url} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-accent text-sm font-semibold text-ember">
              {userInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Sair">
          <LogOut className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Link
        to="/app/profile"
        className="flex w-full min-w-0 items-center gap-2 rounded-md p-1 text-left outline-none ring-offset-background transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="size-9 border border-border">
          {user?.avatar_url ? (
            <AvatarImage src={user.avatar_url} alt={user.name} />
          ) : null}
          <AvatarFallback className="bg-accent text-sm font-semibold text-ember">
            {userInitials(user?.name)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">
            {user?.name}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {user?.jobTitle || user?.email}
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
