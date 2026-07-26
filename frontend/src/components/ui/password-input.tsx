import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        className="absolute left-0 top-0 z-10 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("pl-10", className)}
        {...props}
      />
    </div>
  )
})
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
