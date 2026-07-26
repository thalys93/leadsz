import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { resetPasswordRequest } from "@/services/auth"
import { useAuthStore } from "@/store/use-auth-store"
import { AuthShell } from "@/pages/auth/components/auth-shell"

const passwordRule = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Inclua uma letra maiúscula")
  .regex(/[a-z]/, "Inclua uma letra minúscula")
  .regex(/[0-9]/, "Inclua um número")
  .regex(/[^A-Za-z0-9]/, "Inclua um caractere especial")

const schema = z
  .object({
    password: passwordRule,
    confirmPassword: z.string().min(1, "Confirme a senha"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof schema>

type LocationState = {
  email?: string
}

export default function ForgotPasswordResetPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as LocationState | null)?.email
  const token = useAuthStore((s) => s.token)
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  if (token) {
    return <Navigate to="/app/dashboard" replace />
  }

  if (!email) {
    return <Navigate to="/forgot-password" replace />
  }

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      await resetPasswordRequest(email!, values.password)
      navigate("/login", { state: { passwordResetSuccess: true } })
    } catch {
      toast.error("Não foi possível salvar a senha")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      headline="Escolha uma senha nova"
      subheadline="Algo que você lembre — e depois é só entrar de novo nos seus leads."
      bullets={[
        "Senha forte, sem complicação",
        "Confirme antes de salvar",
        "Em seguida você já entra na conta",
      ]}
      formTitle="Nova senha"
      footer={
        <>
          Voltar ao{" "}
          <Link
            to="/"
            className="font-medium text-ember underline-offset-4 hover:underline"
          >
            login
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Escolha uma senha forte. Depois entre de novo.
        </p>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Salvando..." : "Salvar senha"}
        </Button>
      </form>
    </AuthShell>
  )
}
