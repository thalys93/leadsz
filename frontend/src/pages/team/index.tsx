import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Navigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createInvitation,
  listInvitations,
  resendInvitation,
  revokeInvitation,
  type Invitation,
} from "@/services/team"
import { useAuthStore } from "@/store/use-auth-store"

const schema = z.object({
  email: z.email("E-mail inválido"),
})

type FormValues = z.infer<typeof schema>

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  ACCEPTED: "Aceito",
  EXPIRED: "Expirado",
  REVOKED: "Revogado",
}

function canManageInvite(invite: Invitation) {
  return invite.status === "PENDING" || invite.status === "EXPIRED"
}

export default function TeamPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const invitationsQuery = useQuery({
    queryKey: ["team", "invitations"],
    queryFn: listInvitations,
    enabled: user?.companyRole === "ADMIN",
  })

  const inviteMutation = useMutation({
    mutationFn: (email: string) => createInvitation(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "invitations"] })
      toast.success("Convite enviado")
      reset()
    },
    onError: () => toast.error("Falha ao criar convite"),
  })

  const resendMutation = useMutation({
    mutationFn: (id: string) => resendInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "invitations"] })
      toast.success("Convite reenviado")
    },
    onError: () => toast.error("Falha ao reenviar convite"),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "invitations"] })
      toast.success("Convite revogado")
    },
    onError: () => toast.error("Falha ao revogar convite"),
  })

  if (user?.companyRole !== "ADMIN") {
    return <Navigate to="/app/dashboard" replace />
  }

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      await inviteMutation.mutateAsync(values.email)
    } finally {
      setLoading(false)
    }
  }

  const actionsPending = resendMutation.isPending || revokeMutation.isPending

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Equipe
        </h1>
        <p className="mt-1 text-muted-foreground">
          Convide membros para a sua empresa.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="w-full space-y-2">
          <Label htmlFor="email">E-mail do convidado</Label>
          <Input
            id="email"
            type="email"
            placeholder="membro@empresa.com"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>
        <Button type="submit" disabled={loading || inviteMutation.isPending}>
          Convidar
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Expira</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {(invitationsQuery.data ?? []).map((invite) => {
              const isResending =
                resendMutation.isPending &&
                resendMutation.variables === invite.id
              const isRevoking =
                revokeMutation.isPending &&
                revokeMutation.variables === invite.id

              return (
                <tr key={invite.id} className="border-t border-border">
                  <td
                    className={`px-4 py-3 ${
                      invite.status === "REVOKED"
                        ? "text-destructive/60 line-through"
                        : ""
                    }`}
                  >
                    {invite.email}
                  </td>
                  <td className="px-4 py-3">
                    {statusLabel[invite.status] ?? invite.status}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    {canManageInvite(invite) ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={actionsPending}
                          onClick={() => resendMutation.mutate(invite.id)}
                        >
                          {isResending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : null}
                          Reenviar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={actionsPending}
                          onClick={() => revokeMutation.mutate(invite.id)}
                        >
                          {isRevoking ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : null}
                          Revogar
                        </Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              )
            })}
            {!invitationsQuery.isLoading &&
            (invitationsQuery.data?.length ?? 0) === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum convite ainda.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
