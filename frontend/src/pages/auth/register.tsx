import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { registerRequest } from "@/services/auth"
import { useAuthStore } from "@/store/use-auth-store"
import { AuthShell } from "@/pages/auth/components/auth-shell"

const passwordRule = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Inclua uma letra maiúscula")
  .regex(/[a-z]/, "Inclua uma letra minúscula")
  .regex(/[0-9]/, "Inclua um número")
  .regex(/[^A-Za-z0-9]/, "Inclua um caractere especial")

const schema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.email("E-mail inválido"),
  password: passwordRule,
  companyName: z.string().min(2, "Informe o nome da empresa"),
})

type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const setSession = useAuthStore((s) => s.setSession)
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
      const data = await registerRequest(values)
      setSession(data.token, data.userData)
      toast.success("Conta criada")
      navigate("/app/dashboard")
    } catch {
      toast.error("Não foi possível criar a conta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      headline="Comece com o que já está na sua cabeça"
      subheadline="Cadastre quem você já falou, anote a próxima ação e pare de perder leads no WhatsApp."
      bullets={[
        "Seu espaço, seus leads, seu ritmo",
        "Checkpoints simples pra medir temperatura",
        "Templates prontos pra não travar na mensagem",
      ]}
      formTitle="Criar conta"
      footer={
        <>
          Já tem acesso?{" "}
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
        <div className="space-y-2">
          <Label htmlFor="companyName">Empresa</Label>
          <Input id="companyName" {...register("companyName")} />
          {errors.companyName ? (
            <p className="text-xs text-destructive">
              {errors.companyName.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Seu nome</Label>
          <Input id="name" {...register("name")} />
          {errors.name ? (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
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
          {loading ? "Criando..." : "Criar conta"}
        </Button>
      </form>
    </AuthShell>
  )
}
