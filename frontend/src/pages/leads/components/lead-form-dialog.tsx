import { useEffect, type ComponentType, type ReactNode } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, CalendarClock, Mail, Plus, Trash2, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CHANNEL_LABELS } from "@/lib/crm"
import { formatPhone, isValidPhone, PHONE_INVALID_MESSAGE } from "@/lib/phone"
import type { ChannelType, Lead, LeadPayload } from "@/types/lead"
import { cn } from "@/lib/utils"

const CHANNELS: ChannelType[] = ["EMAIL", "WHATSAPP", "LINKEDIN", "INSTAGRAM", "OUTRO"]

const schema = z.object({
  contactName: z.string().min(2, "Informe o nome"),
  companyName: z.string().optional(),
  primaryChannel: z.enum(["EMAIL", "WHATSAPP", "LINKEDIN", "INSTAGRAM", "OUTRO"]),
  service: z.string().optional(),
  dealValue: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionAt: z.string().optional(),
  notes: z.string().optional(),
  channels: z.array(
    z
      .object({
        type: z.enum(["EMAIL", "WHATSAPP", "LINKEDIN", "INSTAGRAM", "OUTRO"]),
        value: z.string().min(1, "Informe o valor do canal"),
      })
      .superRefine((channel, ctx) => {
        if (channel.type === "WHATSAPP" && !isValidPhone(channel.value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: PHONE_INVALID_MESSAGE,
            path: ["value"],
          })
        }
      })
  ),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: Lead | null
  onSubmit: (payload: LeadPayload) => Promise<unknown>
  submitting?: boolean
}

function toFormValues(lead?: Lead | null): FormValues {
  return {
    contactName: lead?.contactName ?? "",
    companyName: lead?.companyName ?? "",
    primaryChannel: lead?.primaryChannel ?? "WHATSAPP",
    service: lead?.service ?? "",
    dealValue: lead?.dealValue != null ? String(lead.dealValue) : "",
    nextAction: lead?.nextAction ?? "",
    nextActionAt: lead?.nextActionAt ? lead.nextActionAt.slice(0, 10) : "",
    notes: lead?.notes ?? "",
    channels:
      lead?.channels?.map((c) => ({
        type: c.type,
        value: c.type === "WHATSAPP" ? formatPhone(c.value) : c.value,
      })) ?? [],
  }
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-sm font-semibold leading-none">{title}</h3>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-4 pl-11">{children}</div>
    </section>
  )
}

export function LeadFormDialog({ open, onOpenChange, lead, onSubmit, submitting }: Props) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(lead),
  })

  const { fields, append, remove } = useFieldArray({ control, name: "channels" })
  const channels = watch("channels")

  useEffect(() => {
    if (open) reset(toFormValues(lead))
  }, [open, lead, reset])

  async function submit(values: FormValues) {
    await onSubmit({
      contactName: values.contactName,
      companyName: values.companyName || null,
      primaryChannel: values.primaryChannel,
      service: values.service || null,
      dealValue: values.dealValue ? Number(values.dealValue) : null,
      nextAction: values.nextAction || null,
      nextActionAt: values.nextActionAt || null,
      notes: values.notes || null,
      channels: values.channels.map((channel) => ({
        ...channel,
        value:
          channel.type === "WHATSAPP"
            ? formatPhone(channel.value)
            : channel.value,
      })),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl gap-0 overflow-hidden p-0">
        <DialogHeader className="space-y-1 border-b border-border px-6 py-5">
          <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
          <DialogDescription>
            {lead
              ? "Atualize as informações do contato e da negociação."
              : "Cadastre um novo contato e defina a próxima ação."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="flex max-h-[calc(90vh-8rem)] flex-col">
          <div className="space-y-6 overflow-y-auto px-6 py-5">
            <FormSection
              icon={UserRound}
              title="Identificação"
              description="Quem é o contato e por qual canal você o alcançou."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Nome *</Label>
                  <Input
                    id="contactName"
                    placeholder="Nome do contato"
                    autoFocus={!lead}
                    {...register("contactName")}
                  />
                  {errors.contactName ? (
                    <p className="text-xs text-destructive">{errors.contactName.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Empresa</Label>
                  <Input
                    id="companyName"
                    placeholder="Opcional"
                    {...register("companyName")}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryChannel">Canal principal</Label>
                  <select id="primaryChannel" className={selectClassName} {...register("primaryChannel")}>
                    {CHANNELS.map((channel) => (
                      <option key={channel} value={channel}>
                        {CHANNEL_LABELS[channel]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">Serviço de interesse</Label>
                  <Input
                    id="service"
                    placeholder="Ex.: Landing page"
                    {...register("service")}
                  />
                </div>
              </div>
            </FormSection>

            <Separator />

            <FormSection
              icon={Building2}
              title="Negociação"
              description="Valor estimado e contexto da oportunidade."
            >
              <div className="space-y-2">
                <Label htmlFor="dealValue">Valor estimado (R$)</Label>
                <Input
                  id="dealValue"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="max-w-xs tabular-nums"
                  {...register("dealValue")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <textarea
                  id="notes"
                  placeholder="Contexto, objeções, preferências..."
                  className={cn(
                    "min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
                    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  )}
                  {...register("notes")}
                />
              </div>
            </FormSection>

            <Separator />

            <FormSection
              icon={CalendarClock}
              title="Próxima ação"
              description="O que fazer em seguida e quando."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="nextAction">Ação</Label>
                  <Input
                    id="nextAction"
                    placeholder="Ex.: Enviar proposta"
                    {...register("nextAction")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextActionAt">Data</Label>
                  <Input id="nextActionAt" type="date" {...register("nextActionAt")} />
                </div>
              </div>
            </FormSection>

            <Separator />

            <FormSection
              icon={Mail}
              title="Canais de contato"
              description="E-mails, telefones e perfis para follow-up."
            >
              {fields.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum canal adicional cadastrado.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => append({ type: "WHATSAPP", value: "" })}
                  >
                    <Plus className="size-3.5" />
                    Adicionar canal
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, index) => {
                    const channelType = channels?.[index]?.type ?? field.type
                    const isPhoneChannel = channelType === "WHATSAPP"
                    const typeField = register(`channels.${index}.type` as const)

                    return (
                      <div key={field.id} className="space-y-1">
                        <div className="flex gap-2">
                          <select
                            className={cn(selectClassName, "w-32 shrink-0")}
                            {...typeField}
                            onChange={(e) => {
                              const nextType = e.target.value as ChannelType
                              void typeField.onChange(e)
                              if (nextType === "WHATSAPP") {
                                const current = channels?.[index]?.value ?? ""
                                const digits = current.replace(/\D/g, "")
                                setValue(
                                  `channels.${index}.value`,
                                  digits.length >= 8 ? formatPhone(current) : "",
                                  { shouldValidate: true, shouldDirty: true }
                                )
                              }
                            }}
                          >
                            {CHANNELS.map((channel) => (
                              <option key={channel} value={channel}>
                                {CHANNEL_LABELS[channel]}
                              </option>
                            ))}
                          </select>
                          {isPhoneChannel ? (
                            <PhoneInput
                              className="min-w-0 flex-1"
                              value={channels?.[index]?.value ?? ""}
                              onChange={(next) => {
                                setValue(`channels.${index}.value`, next, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                })
                              }}
                              aria-invalid={Boolean(
                                errors.channels?.[index]?.value
                              )}
                            />
                          ) : (
                            <Input
                              placeholder="Valor do contato"
                              className="min-w-0 flex-1"
                              value={channels?.[index]?.value ?? ""}
                              onChange={(e) => {
                                setValue(
                                  `channels.${index}.value`,
                                  e.target.value,
                                  { shouldValidate: true, shouldDirty: true }
                                )
                              }}
                            />
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        {errors.channels?.[index]?.value ? (
                          <p className="text-xs text-destructive">
                            {errors.channels[index]?.value?.message}
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ type: "WHATSAPP", value: "" })}
                  >
                    <Plus className="size-3.5" />
                    Adicionar canal
                  </Button>
                </div>
              )}
            </FormSection>
          </div>

          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : lead ? "Salvar alterações" : "Criar lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
