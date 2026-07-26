import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type SVGProps,
} from "react"
import * as Flags from "country-flag-icons/react/3x2"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  composePhone,
  DEFAULT_PHONE_COUNTRY,
  formatNationalNumber,
  getPhoneCountry,
  parsePhone,
  PHONE_COUNTRIES,
  type PhoneCountry,
} from "@/lib/phone"
import { cn } from "@/lib/utils"

type FlagMap = Record<string, ComponentType<SVGProps<SVGSVGElement>>>

const FLAG_MAP = Flags as unknown as FlagMap

function CountryFlag({ iso, className }: { iso: string; className?: string }) {
  const Flag = FLAG_MAP[iso]
  if (!Flag) return null
  return (
    <Flag
      className={cn("h-3.5 w-5 rounded-[2px] object-cover", className)}
      aria-label={iso}
    />
  )
}

type PhoneInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  "aria-invalid"?: boolean
}

export function PhoneInput({
  id,
  value,
  onChange,
  placeholder = "51 99148-5930",
  disabled,
  className,
  "aria-invalid": ariaInvalid,
}: PhoneInputProps) {
  const [query, setQuery] = useState("")
  const parsed = parsePhone(value)
  const [iso, setIso] = useState(parsed.iso || DEFAULT_PHONE_COUNTRY)

  useEffect(() => {
    if (value.trim()) setIso(parsePhone(value).iso)
  }, [value])

  const country = getPhoneCountry(iso)
  const nationalDisplay = formatNationalNumber(parsed.nationalDigits, country.iso)

  const filteredCountries = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return PHONE_COUNTRIES
    return PHONE_COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.dialCode.includes(term.replace("+", "")) ||
        item.iso.toLowerCase().includes(term)
    )
  }, [query])

  function selectCountry(next: PhoneCountry) {
    setIso(next.iso)
    onChange(composePhone(next.iso, parsed.nationalDigits))
    setQuery("")
  }

  function handleNationalChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, country.maxNationalLength)
    onChange(composePhone(iso, digits))
  }

  return (
    <div
      className={cn(
        "flex h-10 w-full overflow-hidden rounded-md border border-input bg-background shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        ariaInvalid && "border-destructive focus-within:ring-destructive",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            className="flex h-full shrink-0 items-center gap-1.5 border-r border-input bg-muted/40 px-2.5 text-sm outline-none transition-colors hover:bg-muted/70 focus-visible:bg-muted/70 disabled:pointer-events-none"
            aria-label="Selecionar país"
          >
            <CountryFlag iso={country.iso} />
            <span className="font-medium tabular-nums">+{country.dialCode}</span>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 p-0">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar país ou DDI"
              className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ScrollArea className="h-56">
            <div className="p-1">
              {filteredCountries.map((item) => {
                const selected = item.iso === country.iso
                return (
                  <DropdownMenuItem
                    key={`${item.iso}-${item.dialCode}`}
                    onSelect={() => selectCountry(item)}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <CountryFlag iso={item.iso} />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      +{item.dialCode}
                    </span>
                    {selected ? <Check className="size-3.5 text-ember" /> : null}
                  </DropdownMenuItem>
                )
              })}
              {filteredCountries.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Nenhum país encontrado
                </p>
              ) : null}
            </div>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        disabled={disabled}
        value={nationalDisplay}
        onChange={(e) => handleNationalChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={ariaInvalid}
        className="h-full rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  )
}
