import { useEffect, useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { loginRequest } from "@/services/auth"
import { useAuthStore } from "@/store/use-auth-store"
import { AuthShell } from "@/pages/auth/components/auth-shell"

const schema = z.object({
  email: z.email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
})

type FormValues = z.infer<typeof schema>

type LocationState = {
  passwordResetSuccess?: boolean
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = useAuthStore((s) => s.token)
  const setSession = useAuthStore((s) => s.setSession)
  const [loading, setLoading] = useState(false)
  const [passwordResetSuccess] = useState(
    () =>
      Boolean((location.state as LocationState | null)?.passwordResetSuccess)
  )
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!passwordResetSuccess) return
    navigate(".", { replace: true, state: {} })
  }, [passwordResetSuccess, navigate])

  if (token) {
    return <Navigate to="/app/dashboard" replace />
  }

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const data = await loginRequest(values.email, values.password)
      setSession(data.token, data.userData)
      toast.success("Login realizado")
      navigate("/app/dashboard")
    } catch {
      toast.error("Credenciais inválidas")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      headline="Seus leads, no seu ritmo"
      subheadline="Entre para ver quem está quente, o que falta fazer e o que já foi conversado."
      bullets={[
        "Cada lead com stage e próxima ação claros",
        "Notas e e-mails no mesmo histórico",
        "Temperatura pra saber onde investir energia",
      ]}
      formTitle="Entrar"
      footer={
        <>
          Primeiro acesso?{" "}
          <Link
            to="/register"
            className="font-medium text-ember underline-offset-4 hover:underline"
          >
            Criar sua conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {passwordResetSuccess ? (
          <p className="text-sm text-ember">
            Senha atualizada. Entre com a nova senha.
          </p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Senha</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-ember underline-offset-4 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  )
}
