import {
  Briefcase,
  Code2,
  FileCode2,
  Globe,
  LayoutTemplate,
  MessageSquareText,
  MonitorSmartphone,
  Palette,
  Rocket,
  ShoppingBag,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react"

export const SERVICE_ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: "Briefcase", icon: Briefcase },
  { name: "LayoutTemplate", icon: LayoutTemplate },
  { name: "Globe", icon: Globe },
  { name: "Code2", icon: Code2 },
  { name: "FileCode2", icon: FileCode2 },
  { name: "MonitorSmartphone", icon: MonitorSmartphone },
  { name: "ShoppingBag", icon: ShoppingBag },
  { name: "Wrench", icon: Wrench },
  { name: "MessageSquareText", icon: MessageSquareText },
  { name: "Palette", icon: Palette },
  { name: "Rocket", icon: Rocket },
  { name: "Sparkles", icon: Sparkles },
]

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  SERVICE_ICON_OPTIONS.map((o) => [o.name, o.icon])
)

export function resolveServiceIcon(name: string | null | undefined): LucideIcon {
  if (name && ICON_MAP[name]) return ICON_MAP[name]
  return Briefcase
}
