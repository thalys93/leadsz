import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPasswordRequest } from "@/services/auth"
import { useAuthStore } from "@/store/use-auth-store"
import { AuthShell } from "@/pages/auth/components/auth-shell"

const schema = z.object({
  email: z.email("E-mail inválido"),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
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

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      await forgotPasswordRequest(values.email)
      navigate("/forgot-password/code", { state: { email: values.email } })
    } catch {
      toast.error("Não foi possível enviar o código")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      headline="Esqueceu a senha? Sem drama"
      subheadline="Manda o e-mail, recebe o código e volta pros seus leads em poucos minutos."
      bullets={[
        "Código curto no e-mail da sua conta",
        "Nova senha no ritmo que você quiser",
        "Depois é só entrar de novo",
      ]}
      formTitle="Recuperar senha"
      footer={
        <>
          Lembrou a senha?{" "}
          <Link
            to="/"
            className="font-medium text-ember underline-offset-4 hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Informe o e-mail da conta. Se existir, enviamos um código.
        </p>
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Enviando..." : "Enviar código"}
        </Button>
      </form>
    </AuthShell>
  )
}
