import * as React from "react"
import { createPortal } from "react-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { createService } from "@/services/catalog-services"
import type { CatalogService } from "@/types/service"
import { parseCatalogPrice } from "@/types/service"
import { formatCurrencyBRL } from "@/lib/crm"
import { resolveServiceIcon } from "@/lib/service-icons"

type ServiceComboboxProps = {
  id?: string
  services: CatalogService[]
  serviceId: string | null
  serviceName: string
  onSelect: (service: CatalogService) => void
  onClear: () => void
  onNameChange: (name: string) => void
  disabled?: boolean
  placeholder?: string
}

type ListPosition = {
  top: number
  left: number
  width: number
}

function findPortalHost(el: HTMLElement | null) {
  return el?.closest<HTMLElement>('[role="dialog"]') ?? document.body
}

export function ServiceCombobox({
  id,
  services,
  serviceId,
  serviceName,
  onSelect,
  onClear,
  onNameChange,
  disabled,
  placeholder = "Buscar ou criar serviço",
}: ServiceComboboxProps) {
  const queryClient = useQueryClient()
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const [debouncedQuery, setDebouncedQuery] = React.useState(serviceName)
  const [position, setPosition] = React.useState<ListPosition | null>(null)
  const [host, setHost] = React.useState<HTMLElement | null>(null)
  const blurTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const listId = React.useId()

  const createMutation = useMutation({
    mutationFn: (name: string) => createService({ name }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      onSelect(created)
      setOpen(false)
      setActiveIndex(-1)
    },
  })

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(serviceName), 200)
    return () => clearTimeout(timer)
  }, [serviceName])

  const filtered = React.useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase()
    const list = query
      ? services.filter((item) => item.name.toLowerCase().includes(query))
      : services
    return list.slice(0, 8)
  }, [services, debouncedQuery])

  const exactMatch = React.useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase()
    if (!query) return true
    return services.some((item) => item.name.toLowerCase() === query)
  }, [services, debouncedQuery])

  const canCreate =
    debouncedQuery.trim().length > 0 && !exactMatch && !createMutation.isPending

  const optionCount = filtered.length + (canCreate ? 1 : 0)
  const showList = open && optionCount > 0

  function clearBlurTimer() {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current)
      blurTimer.current = null
    }
  }

  function pick(service: CatalogService) {
    clearBlurTimer()
    onSelect(service)
    setOpen(false)
    setActiveIndex(-1)
  }

  function createFromQuery() {
    const name = debouncedQuery.trim()
    if (!name || exactMatch) return
    createMutation.mutate(name)
  }

  function updatePosition() {
    const el = inputRef.current
    if (!el) return
    const portalHost = findPortalHost(el)
    setHost(portalHost)
    const inputRect = el.getBoundingClientRect()
    const hostRect = portalHost.getBoundingClientRect()
    setPosition({
      top: inputRect.bottom - hostRect.top + 4,
      left: inputRect.left - hostRect.left,
      width: inputRect.width,
    })
  }

  React.useEffect(() => {
    if (!showList) return
    updatePosition()
    const onScrollOrResize = () => updatePosition()
    window.addEventListener("resize", onScrollOrResize)
    window.addEventListener("scroll", onScrollOrResize, true)
    return () => {
      window.removeEventListener("resize", onScrollOrResize)
      window.removeEventListener("scroll", onScrollOrResize, true)
    }
  }, [showList, optionCount])

  React.useEffect(() => {
    if (!showList) return

    const onPointerDownCapture = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const option = target.closest<HTMLElement>("[data-service-option]")
      if (option) {
        const optionId = option.dataset.serviceOption
        event.preventDefault()
        event.stopImmediatePropagation()
        clearBlurTimer()
        if (optionId === "__create__") {
          createFromQuery()
          return
        }
        const service = services.find((item) => item.id === optionId)
        if (service) pick(service)
        return
      }

      if (
        inputRef.current?.contains(target) ||
        target.closest("[data-suggest-list]")
      ) {
        return
      }

      setOpen(false)
      setActiveIndex(-1)
    }

    document.addEventListener("pointerdown", onPointerDownCapture, true)
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true)
    }
  }, [showList, services, debouncedQuery, exactMatch])

  const selected = serviceId
    ? services.find((item) => item.id === serviceId)
    : null
  const SelectedIcon = resolveServiceIcon(selected?.icon)

  const list =
    showList && position && host
      ? createPortal(
          <ul
            id={listId}
            role="listbox"
            data-suggest-list=""
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
              width: position.width,
            }}
            className="z-[80] max-h-48 overflow-auto rounded-md border border-border bg-background py-1 shadow-md"
          >
            {filtered.map((item, index) => {
              const ideal = parseCatalogPrice(item.idealPrice)
              const ItemIcon = resolveServiceIcon(item.icon)
              return (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    data-service-option={item.id}
                    className={cn(
                      "flex w-full items-start gap-2.5 px-3 py-2 text-left text-sm hover:bg-muted",
                      index === activeIndex && "bg-muted"
                    )}
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <ItemIcon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="block font-medium">{item.name}</span>
                      {ideal != null ? (
                        <span className="block text-xs text-muted-foreground">
                          Ideal {formatCurrencyBRL(ideal)}
                        </span>
                      ) : (
                        <span className="block text-xs text-muted-foreground">
                          Sem âncora de preço
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
            {canCreate ? (
              <li
                role="option"
                aria-selected={activeIndex === filtered.length}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  data-service-option="__create__"
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
                    activeIndex === filtered.length && "bg-muted"
                  )}
                >
                  <Plus className="size-3.5 shrink-0" />
                  Criar «{debouncedQuery.trim()}»
                </button>
              </li>
            ) : null}
          </ul>,
          host
        )
      : null

  return (
    <div className="relative space-y-1.5">
      <div className="relative">
        {selected ? (
          <span className="pointer-events-none absolute left-2.5 top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-md bg-primary/10 text-primary">
            <SelectedIcon className="size-3.5" />
          </span>
        ) : null}
        <Input
          id={id}
          ref={inputRef}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled || createMutation.isPending}
          placeholder={placeholder}
          value={serviceName}
          className={cn(selected && "pl-10")}
          onChange={(e) => {
            const next = e.target.value
            onNameChange(next)
            if (serviceId) onClear()
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => {
            clearBlurTimer()
            setOpen(true)
            requestAnimationFrame(updatePosition)
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => {
              setOpen(false)
              setActiveIndex(-1)
            }, 150)
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              if (open) {
                e.preventDefault()
                e.stopPropagation()
                setOpen(false)
                setActiveIndex(-1)
              }
              return
            }
            if (!showList) return
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setActiveIndex((i) => (i + 1) % optionCount)
              return
            }
            if (e.key === "ArrowUp") {
              e.preventDefault()
              setActiveIndex((i) => (i <= 0 ? optionCount - 1 : i - 1))
              return
            }
            if (e.key === "Enter" && activeIndex >= 0) {
              e.preventDefault()
              if (activeIndex < filtered.length) {
                pick(filtered[activeIndex])
              } else if (canCreate) {
                createFromQuery()
              }
            }
          }}
        />
      </div>
      {list}
      {selected ? (
        <p className="text-xs text-muted-foreground">
          Âncora:{" "}
          {[
            parseCatalogPrice(selected.minPrice),
            parseCatalogPrice(selected.idealPrice),
            parseCatalogPrice(selected.maxPrice),
          ]
            .map((v) => formatCurrencyBRL(v))
            .join(" · ")}
        </p>
      ) : null}
      {createMutation.isError ? (
        <p className="text-xs text-destructive">Não foi possível criar o serviço.</p>
      ) : null}
    </div>
  )
}
