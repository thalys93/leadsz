import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

type SuggestInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> & {
  suggestions: string[]
  value: string
  onChange: (value: string) => void
  debounceMs?: number
}

type ListPosition = {
  top: number
  left: number
  width: number
}

function findPortalHost(el: HTMLElement | null) {
  return el?.closest<HTMLElement>('[role="dialog"]') ?? document.body
}

const SuggestInput = React.forwardRef<HTMLInputElement, SuggestInputProps>(
  (
    {
      suggestions,
      value,
      onChange,
      className,
      onBlur,
      onFocus,
      onKeyDown,
      debounceMs = 200,
      ...props
    },
    forwardedRef
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const onChangeRef = React.useRef(onChange)
    const [open, setOpen] = React.useState(false)
    const [activeIndex, setActiveIndex] = React.useState(-1)
    const [debouncedQuery, setDebouncedQuery] = React.useState(value)
    const [position, setPosition] = React.useState<ListPosition | null>(null)
    const [host, setHost] = React.useState<HTMLElement | null>(null)
    const blurTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const listId = React.useId()

    onChangeRef.current = onChange

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node
        if (typeof forwardedRef === "function") forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
      },
      [forwardedRef]
    )

    React.useEffect(() => {
      const timer = setTimeout(() => setDebouncedQuery(value), debounceMs)
      return () => clearTimeout(timer)
    }, [value, debounceMs])

    const filtered = React.useMemo(() => {
      const query = debouncedQuery.trim().toLowerCase()
      const list = query
        ? suggestions.filter((item) => item.toLowerCase().includes(query))
        : suggestions
      return list.slice(0, 8)
    }, [suggestions, debouncedQuery])

    const showList = open && filtered.length > 0

    function clearBlurTimer() {
      if (blurTimer.current) {
        clearTimeout(blurTimer.current)
        blurTimer.current = null
      }
    }

    function pick(item: string) {
      clearBlurTimer()
      onChangeRef.current(item)
      setDebouncedQuery(item)
      setOpen(false)
      setActiveIndex(-1)
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
    }, [showList, filtered.length])

    React.useEffect(() => {
      if (!showList) return

      const onPointerDownCapture = (event: PointerEvent) => {
        const target = event.target
        if (!(target instanceof Element)) return

        const option = target.closest<HTMLElement>("[data-suggest-option]")
        if (option) {
          const item = option.dataset.suggestOption
          if (item == null) return
          event.preventDefault()
          event.stopImmediatePropagation()
          clearBlurTimer()
          onChangeRef.current(item)
          setDebouncedQuery(item)
          setOpen(false)
          setActiveIndex(-1)
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
    }, [showList])

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
              {filtered.map((item, index) => (
                <li key={item} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    tabIndex={-1}
                    data-suggest-option={item}
                    className={cn(
                      "flex w-full px-3 py-2 text-left text-sm hover:bg-muted",
                      index === activeIndex && "bg-muted"
                    )}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>,
            host
          )
        : null

    return (
      <div className="relative">
        <Input
          {...props}
          ref={setRefs}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          className={className}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={(e) => {
            clearBlurTimer()
            setOpen(true)
            requestAnimationFrame(updatePosition)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            blurTimer.current = setTimeout(() => {
              setOpen(false)
              setActiveIndex(-1)
            }, 150)
            onBlur?.(e)
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              if (open) {
                e.preventDefault()
                e.stopPropagation()
                setOpen(false)
                setActiveIndex(-1)
                return
              }
              onKeyDown?.(e)
              return
            }
            if (!showList) {
              onKeyDown?.(e)
              return
            }
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setActiveIndex((i) => (i + 1) % filtered.length)
              return
            }
            if (e.key === "ArrowUp") {
              e.preventDefault()
              setActiveIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1))
              return
            }
            if (e.key === "Enter" && activeIndex >= 0) {
              e.preventDefault()
              pick(filtered[activeIndex])
              return
            }
            onKeyDown?.(e)
          }}
        />
        {list}
      </div>
    )
  }
)
SuggestInput.displayName = "SuggestInput"

export { SuggestInput }
