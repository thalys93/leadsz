import { useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { acceptInviteRequest } from "@/services/auth"
import { useAuthStore } from "@/store/use-auth-store"
import { AuthShell } from "@/pages/auth/components/auth-shell"

const schema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Inclua uma letra maiúscula")
    .regex(/[a-z]/, "Inclua uma letra minúscula")
    .regex(/[0-9]/, "Inclua um número")
    .regex(/[^A-Za-z0-9]/, "Inclua um caractere especial"),
})

type FormValues = z.infer<typeof schema>

export default function InvitePage() {
  const navigate = useNavigate()
  const { token: pathToken } = useParams()
  const [searchParams] = useSearchParams()
  const inviteToken = pathToken || searchParams.get("token") || ""
  const setSession = useAuthStore((s) => s.setSession)
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    if (!inviteToken) {
      toast.error("Convite inválido")
      return
    }
    setLoading(true)
    try {
      const data = await acceptInviteRequest({
        token: inviteToken,
        name: values.name,
        password: values.password,
      })
      setSession(data.token, data.userData)
      toast.success("Convite aceito")
      navigate("/app/dashboard")
    } catch {
      toast.error("Não foi possível aceitar o convite")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      headline="Bem-vindo ao time"
      subheadline="Aceite o convite e acompanhe os mesmos leads que a gente já está tocando."
      bullets={[
        "Mesmos leads e estágio de cada conversa",
        "Histórico e templates da equipe",
        "Só falta seu nome e uma senha",
      ]}
      formTitle="Aceitar convite"
    >
      {!inviteToken ? (
        <p className="text-sm text-destructive">
          Token de convite ausente.{" "}
          <Link to="/" className="underline">
            Ir para o login
          </Link>
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Seu nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <PasswordInput id="password" {...register("password")} />
            {errors.password ? (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Aceitando..." : "Aceitar convite"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
