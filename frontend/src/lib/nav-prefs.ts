import {
  LayoutDashboard,
  ListChecks,
  FileText,
  Users,
  MessageSquareText,
  Mail,
  Target,
  Sparkles,
  CalendarClock,
  FolderKanban,
  Inbox,
  Layers,
  type LucideIcon,
} from "lucide-react"

export type NavItemId =
  | "dashboard"
  | "leads"
  | "templates"
  | "team"
  | "test-email"

export type NavItemDef = {
  id: NavItemId
  to: string
  label: string
  defaultIcon: string
  adminOnly?: boolean
}

export const NAV_ITEMS: NavItemDef[] = [
  {
    id: "dashboard",
    to: "/app/dashboard",
    label: "Dashboard",
    defaultIcon: "LayoutDashboard",
  },
  {
    id: "leads",
    to: "/app/leads",
    label: "Leads",
    defaultIcon: "ListChecks",
  },
  {
    id: "templates",
    to: "/app/templates",
    label: "Templates",
    defaultIcon: "FileText",
  },
  {
    id: "team",
    to: "/app/team",
    label: "Equipe",
    defaultIcon: "Users",
    adminOnly: true,
  },
  {
    id: "test-email",
    to: "/app/test-email",
    label: "Testar e-mail",
    defaultIcon: "Mail",
    adminOnly: true,
  },
]

export const NAV_ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: "LayoutDashboard", icon: LayoutDashboard },
  { name: "ListChecks", icon: ListChecks },
  { name: "FileText", icon: FileText },
  { name: "Users", icon: Users },
  { name: "MessageSquareText", icon: MessageSquareText },
  { name: "Mail", icon: Mail },
  { name: "Target", icon: Target },
  { name: "Sparkles", icon: Sparkles },
  { name: "CalendarClock", icon: CalendarClock },
  { name: "FolderKanban", icon: FolderKanban },
  { name: "Inbox", icon: Inbox },
  { name: "Layers", icon: Layers },
]

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  NAV_ICON_OPTIONS.map((o) => [o.name, o.icon])
)

const STORAGE_KEY = "leadz-nav-prefs-v2"

export type NavPrefs = {
  hidden: NavItemId[]
  icons: Partial<Record<NavItemId, string>>
}

const DEFAULT_PREFS: NavPrefs = { hidden: [], icons: {} }

export function loadNavPrefs(): NavPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw) as Partial<NavPrefs>
    return {
      hidden: Array.isArray(parsed.hidden)
        ? parsed.hidden.filter((id): id is NavItemId =>
            NAV_ITEMS.some((item) => item.id === id)
          )
        : [],
      icons:
        parsed.icons && typeof parsed.icons === "object" ? parsed.icons : {},
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function saveNavPrefs(prefs: NavPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function resolveNavIcon(item: NavItemDef, prefs: NavPrefs): LucideIcon {
  const name = prefs.icons[item.id] || item.defaultIcon
  return ICON_MAP[name] || ICON_MAP[item.defaultIcon] || ListChecks
}
