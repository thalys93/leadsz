import { useEffect, useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  forgotPasswordRequest,
  verifyResetCodeRequest,
} from "@/services/auth"
import { useAuthStore } from "@/store/use-auth-store"
import { AuthShell } from "@/pages/auth/components/auth-shell"

const schema = z.object({
  code: z
    .string()
    .regex(/^\d{4}$/, "Informe o código de 4 dígitos"),
})

type FormValues = z.infer<typeof schema>

type LocationState = {
  email?: string
}

const RESEND_COOLDOWN_SECONDS = 30

export default function ForgotPasswordCodePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as LocationState | null)?.email
  const token = useAuthStore((s) => s.token)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  if (token) {
    return <Navigate to="/app/dashboard" replace />
  }

  if (!email) {
    return <Navigate to="/forgot-password" replace />
  }

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      await verifyResetCodeRequest(email!, values.code)
      navigate("/forgot-password/reset", { state: { email } })
    } catch {
      toast.error("Código inválido")
    } finally {
      setLoading(false)
    }
  }

  async function onResend() {
    if (cooldown > 0 || resending) return
    setResending(true)
    try {
      await forgotPasswordRequest(email!)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      toast.success("Código reenviado")
    } catch {
      toast.error("Não foi possível reenviar o código")
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      headline="Quase lá — só o código"
      subheadline="Confira o e-mail, digite os 4 dígitos e siga pra criar a nova senha."
      bullets={[
        "Código curto, direto no e-mail",
        "Pode pedir reenvio se precisar",
        "Depois você escolhe a nova senha",
      ]}
      formTitle="Digite o código"
      footer={
        <>
          E-mail errado?{" "}
          <Link
            to="/forgot-password"
            className="font-medium text-ember underline-offset-4 hover:underline"
          >
            Voltar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enviamos um código de 4 dígitos para {email}.
        </p>
        {import.meta.env.DEV ? (
          <p className="text-xs text-muted-foreground">
            Em desenvolvimento o código aparece no terminal do backend
          </p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            {...register("code")}
          />
          {errors.code ? (
            <p className="text-xs text-destructive">{errors.code.message}</p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Validando..." : "Continuar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={cooldown > 0 || resending}
          onClick={onResend}
        >
          {cooldown > 0
            ? `Reenviar código (${cooldown}s)`
            : resending
              ? "Reenviando..."
              : "Reenviar código"}
        </Button>
      </form>
    </AuthShell>
  )
}
