import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { ChevronDown, Eye, EyeOff, Menu, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { BrandLogo } from "@/components/brand-logo"
import { EnvBadge } from "@/components/env-badge"
import { UserAvatarMenu } from "@/components/user-avatar-menu"
import { useAuthStore } from "@/store/use-auth-store"
import { cn } from "@/lib/utils"
import {
  NAV_ICON_OPTIONS,
  NAV_ITEMS,
  loadNavPrefs,
  resolveNavIcon,
  saveNavPrefs,
  type NavItemDef,
  type NavItemId,
  type NavPrefs,
} from "@/lib/nav-prefs"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  )

function BrandBlock() {
  return (
    <div>
      <BrandLogo variant="lockup" className="h-8 w-auto max-w-[10.5rem]" />
      <div className="mt-1 flex items-center gap-2">
        <p className="text-xs text-muted-foreground">Seus leads</p>
        <EnvBadge />
      </div>
    </div>
  )
}

function NavItemLink({
  item,
  prefs,
  hidden,
  onNavigate,
  onToggleHidden,
  onChangeIcon,
}: {
  item: NavItemDef
  prefs: NavPrefs
  hidden: boolean
  onNavigate?: () => void
  onToggleHidden: (id: NavItemId) => void
  onChangeIcon: (id: NavItemId, icon: string) => void
}) {
  const Icon = resolveNavIcon(item, prefs)
  const currentIcon = prefs.icons[item.id] || item.defaultIcon

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={cn("w-full", hidden && "opacity-40 hover:opacity-65")}>
          <NavLink
            to={item.to}
            className={linkClass}
            onClick={onNavigate}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem onSelect={() => onToggleHidden(item.id)}>
          {hidden ? (
            <>
              <Eye className="size-4" />
              Mostrar no menu
            </>
          ) : (
            <>
              <EyeOff className="size-4" />
              Esconder
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Palette className="size-4" />
            Alterar ícone
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-auto p-2">
            <div className="grid grid-cols-4 gap-1">
              {NAV_ICON_OPTIONS.map(({ name, icon: OptionIcon }) => (
                <ContextMenuItem
                  key={name}
                  className={cn(
                    "flex size-9 items-center justify-center p-0",
                    currentIcon === name && "bg-accent text-accent-foreground"
                  )}
                  onSelect={() => onChangeIcon(item.id, name)}
                >
                  <OptionIcon className="size-4" />
                  <span className="sr-only">{name}</span>
                </ContextMenuItem>
              ))}
            </div>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function AppNav({
  isAdmin,
  prefs,
  onPrefsChange,
  onNavigate,
}: {
  isAdmin: boolean
  prefs: NavPrefs
  onPrefsChange: (prefs: NavPrefs) => void
  onNavigate?: () => void
}) {
  const available = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)
  const visible = available.filter((item) => !prefs.hidden.includes(item.id))
  const hidden = available.filter((item) => prefs.hidden.includes(item.id))

  function toggleHidden(id: NavItemId) {
    const isHidden = prefs.hidden.includes(id)
    onPrefsChange({
      ...prefs,
      hidden: isHidden
        ? prefs.hidden.filter((itemId) => itemId !== id)
        : [...prefs.hidden, id],
    })
  }

  function changeIcon(id: NavItemId, icon: string) {
    onPrefsChange({
      ...prefs,
      icons: { ...prefs.icons, [id]: icon },
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <nav className="flex flex-col gap-1">
        {visible.map((item) => (
          <NavItemLink
            key={item.id}
            item={item}
            prefs={prefs}
            hidden={false}
            onNavigate={onNavigate}
            onToggleHidden={toggleHidden}
            onChangeIcon={changeIcon}
          />
        ))}
      </nav>

      {hidden.length > 0 ? (
        <details className="group mt-auto">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-muted-foreground [&::-webkit-details-marker]:hidden">
            <Eye className="size-3.5 shrink-0 opacity-70" />
            <span className="truncate">Ocultados</span>
            <span className="tabular-nums opacity-70">{hidden.length}</span>
            <ChevronDown className="ml-auto size-3.5 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <nav className="mt-1 flex flex-col gap-0.5">
            {hidden.map((item) => (
              <NavItemLink
                key={item.id}
                item={item}
                prefs={prefs}
                hidden
                onNavigate={onNavigate}
                onToggleHidden={toggleHidden}
                onChangeIcon={changeIcon}
              />
            ))}
          </nav>
        </details>
      ) : null}
    </div>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isAdmin = user?.companyRole === "ADMIN"
  const [mobileOpen, setMobileOpen] = useState(false)
  const [prefs, setPrefs] = useState<NavPrefs>(() => loadNavPrefs())

  function handlePrefsChange(next: NavPrefs) {
    setPrefs(next)
    saveNavPrefs(next)
  }

  function handleLogout() {
    logout()
    navigate("/")
  }

  return (
    <div className="h-dvh overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-50/80 via-background to-background dark:from-orange-950/20 dark:via-background dark:to-background">
      <div className="mx-auto flex h-full max-w-7xl gap-6 px-4 py-4 sm:px-6 sm:py-5">
        <aside className="hidden w-56 shrink-0 flex-col gap-6 md:flex">
          <BrandBlock />
          <AppNav
            isAdmin={!!isAdmin}
            prefs={prefs}
            onPrefsChange={handlePrefsChange}
          />
          <div className="mt-auto space-y-3 border-t border-border pt-4">
            <UserAvatarMenu onLogout={handleLogout} />
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border pb-3 md:hidden">
            <div className="flex items-center gap-2">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Abrir menu">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex w-[18rem] flex-col gap-6">
                  <SheetHeader>
                    <SheetTitle className="text-left">
                      <BrandLogo
                        variant="lockup"
                        className="h-7 w-auto max-w-[9rem]"
                      />
                    </SheetTitle>
                  </SheetHeader>
                  <BrandBlock />
                  <AppNav
                    isAdmin={!!isAdmin}
                    prefs={prefs}
                    onPrefsChange={handlePrefsChange}
                    onNavigate={() => setMobileOpen(false)}
                  />
                  <div className="mt-auto border-t border-border pt-4">
                    <UserAvatarMenu
                      onLogout={() => {
                        setMobileOpen(false)
                        handleLogout()
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              <BrandLogo variant="mark" className="size-8" />
              <EnvBadge />
            </div>
            <div className="flex items-center gap-1">
              <UserAvatarMenu compact onLogout={handleLogout} />
            </div>
          </header>
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  )
}
