import { useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  EyeOff,
  Home,
  Menu,
  Palette,
} from "lucide-react"
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

const APP_HOME = "/app/dashboard"

function resolveBackTarget(pathname: string): string | null {
  if (pathname === APP_HOME || pathname === "/app") return null
  if (/^\/app\/leads\/[^/]+/.test(pathname)) return "/app/leads"
  if (
    pathname === "/app/templates/new" ||
    /^\/app\/templates\/[^/]+\/edit$/.test(pathname)
  ) {
    return "/app/templates"
  }
  if (pathname.startsWith("/app/")) return APP_HOME
  return null
}

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
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isAdmin = user?.companyRole === "ADMIN"
  const [mobileOpen, setMobileOpen] = useState(false)
  const [prefs, setPrefs] = useState<NavPrefs>(() => loadNavPrefs())
  const backTarget = resolveBackTarget(location.pathname)
  const reduceMotion = useReducedMotion()
  const backMotion = reduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }

  function handlePrefsChange(next: NavPrefs) {
    setPrefs(next)
    saveNavPrefs(next)
  }

  function handleLogout() {
    logout()
    navigate("/")
  }

  function closeMobileMenu() {
    setMobileOpen(false)
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
          <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border md:hidden">
            <div className="flex min-w-0 items-center">
              <AnimatePresence initial={false}>
                {backTarget ? (
                  <motion.div
                    key="back"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "2.75rem", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={backMotion}
                    className="overflow-hidden"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0"
                      aria-label="Voltar"
                      onClick={() => navigate(backTarget)}
                    >
                      <motion.span
                        initial={{ x: -8 }}
                        animate={{ x: 0 }}
                        exit={{ x: -8 }}
                        transition={backMotion}
                        className="inline-flex"
                      >
                        <ArrowLeft className="size-5" />
                      </motion.span>
                    </Button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <div className="flex min-w-0 items-center gap-1">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 shrink-0"
                      aria-label="Abrir menu"
                    >
                      <Menu className="size-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="flex w-[18rem] flex-col gap-6 overflow-y-auto"
                  >
                    <SheetHeader className="space-y-3">
                      <SheetTitle className="sr-only">
                        Menu de navegação
                      </SheetTitle>
                      <Button
                        asChild
                        variant="ghost"
                        className="h-11 justify-start gap-2 px-3"
                      >
                        <Link to={APP_HOME} onClick={closeMobileMenu}>
                          <Home className="size-4 shrink-0" />
                          Início
                        </Link>
                      </Button>
                    </SheetHeader>
                    <AppNav
                      isAdmin={!!isAdmin}
                      prefs={prefs}
                      onPrefsChange={handlePrefsChange}
                      onNavigate={closeMobileMenu}
                    />
                    <div className="mt-auto border-t border-border pt-4">
                      <UserAvatarMenu
                        onNavigate={closeMobileMenu}
                        onLogout={() => {
                          closeMobileMenu()
                          handleLogout()
                        }}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
                <Link
                  to={APP_HOME}
                  className="ml-1 min-w-0 rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Ir para o início"
                >
                  <BrandLogo
                    variant="lockup"
                    className="h-7 w-auto max-w-[8rem] sm:max-w-[10.5rem]"
                  />
                </Link>
                <EnvBadge />
              </div>
            </div>
            <UserAvatarMenu compact onLogout={handleLogout} />
          </header>
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  )
}
