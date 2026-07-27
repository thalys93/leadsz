import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Building2, CalendarClock, Mail, Plus, Trash2, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { Separator } from "@/components/ui/separator"
import { SuggestInput } from "@/components/ui/suggest-input"
import { ServiceCombobox } from "@/components/service-combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CHANNEL_LABELS, formatCurrencyBRL } from "@/lib/crm"
import { formatPhone, isValidPhone, PHONE_INVALID_MESSAGE } from "@/lib/phone"
import { getLeadSuggestions } from "@/services/leads"
import { listServices } from "@/services/catalog-services"
import type { ChannelType, Lead, LeadPayload } from "@/types/lead"
import type { CatalogService } from "@/types/service"
import { parseCatalogPrice } from "@/types/service"
import { cn } from "@/lib/utils"

const CHANNELS: ChannelType[] = ["EMAIL", "WHATSAPP", "LINKEDIN", "INSTAGRAM", "OUTRO"]

const schema = z.object({
  contactName: z.string().min(2, "Informe o nome"),
  companyName: z.string().optional(),
  primaryChannel: z.enum(["EMAIL", "WHATSAPP", "LINKEDIN", "INSTAGRAM", "OUTRO"]),
  serviceId: z.string().nullable().optional(),
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
    serviceId: lead?.serviceId ?? null,
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

function dealValueWarning(
  dealValueRaw: string | undefined,
  catalog: CatalogService | null | undefined
) {
  if (!catalog) return null
  const value = dealValueRaw ? Number(dealValueRaw) : NaN
  if (!Number.isFinite(value)) return null

  const min = parseCatalogPrice(catalog.minPrice)
  const ideal = parseCatalogPrice(catalog.idealPrice)

  if (min != null && value < min) {
    return `Abaixo do mínimo (${formatCurrencyBRL(min)}). Desconto só com escopo menor.`
  }
  if (ideal != null && value < ideal * 0.9) {
    return `Mais de 10% abaixo do ideal (${formatCurrencyBRL(ideal)}). Confirme se o escopo encolheu.`
  }
  return null
}

export function LeadFormDialog({ open, onOpenChange, lead, onSubmit, submitting }: Props) {
  const [discardOpen, setDiscardOpen] = useState(false)
  const queryClient = useQueryClient()
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(lead),
  })

  const { fields, append, remove } = useFieldArray({ control, name: "channels" })
  const channels = watch("channels")
  const serviceId = watch("serviceId")
  const serviceName = watch("service")
  const dealValue = watch("dealValue")

  const suggestionsQuery = useQuery({
    queryKey: ["lead-suggestions"],
    queryFn: getLeadSuggestions,
    enabled: open,
    staleTime: 0,
    refetchOnMount: "always",
  })

  const servicesQuery = useQuery({
    queryKey: ["services", "true"],
    queryFn: () => listServices("true"),
    enabled: open,
  })

  const catalogServices = servicesQuery.data ?? []

  const selectedService = useMemo(() => {
    if (!serviceId) return null
    return catalogServices.find((item) => item.id === serviceId) ?? null
  }, [catalogServices, serviceId])

  const priceWarning = dealValueWarning(dealValue, selectedService)

  useEffect(() => {
    if (open) {
      reset(toFormValues(lead))
      setDiscardOpen(false)
      void queryClient.invalidateQueries({ queryKey: ["lead-suggestions"] })
      void queryClient.invalidateQueries({ queryKey: ["services"] })
    }
  }, [open, lead, reset, queryClient])

  function requestClose() {
    if (isDirty) {
      setDiscardOpen(true)
      return
    }
    setDiscardOpen(false)
    onOpenChange(false)
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      onOpenChange(true)
      return
    }
    if (isDirty) {
      setDiscardOpen(true)
      return
    }
    setDiscardOpen(false)
    onOpenChange(false)
  }

  function confirmDiscard() {
    setDiscardOpen(false)
    onOpenChange(false)
  }

  function blockDismissIfDirty(event: Event) {
    if (!isDirty) return
    event.preventDefault()
    setDiscardOpen(true)
  }

  function keepSuggestInteraction(event: Event) {
    const detail = "detail" in event ? event.detail : null
    const original =
      detail &&
      typeof detail === "object" &&
      detail !== null &&
      "originalEvent" in detail
        ? (detail as { originalEvent: Event }).originalEvent
        : null
    const target = original?.target ?? event.target
    if (target instanceof Element && target.closest("[data-suggest-list]")) {
      event.preventDefault()
      return true
    }
    return false
  }

  function handleDismissOutside(event: Event) {
    if (keepSuggestInteraction(event)) return
    blockDismissIfDirty(event)
  }

  function applyCatalogService(service: CatalogService) {
    setValue("serviceId", service.id, { shouldDirty: true })
    setValue("service", service.name, { shouldDirty: true })
    const ideal = parseCatalogPrice(service.idealPrice)
    if (ideal != null) {
      setValue("dealValue", String(ideal), { shouldDirty: true })
    }
  }

  async function submit(values: FormValues) {
    await onSubmit({
      contactName: values.contactName,
      companyName: values.companyName || null,
      primaryChannel: values.primaryChannel,
      serviceId: values.serviceId || null,
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
    await queryClient.invalidateQueries({ queryKey: ["lead-suggestions"] })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-xl flex-col gap-0 overflow-hidden p-0"
        onCloseClick={requestClose}
        onPointerDownOutside={handleDismissOutside}
        onInteractOutside={handleDismissOutside}
        onFocusOutside={keepSuggestInteraction}
        onEscapeKeyDown={(event) => {
          if (discardOpen) {
            event.preventDefault()
            setDiscardOpen(false)
            return
          }
          blockDismissIfDirty(event)
        }}
      >
        <div className="relative flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-5 pr-12">
            <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
            <DialogDescription>
              {lead
                ? "Atualize as informações do contato e da negociação."
                : "Cadastre um novo contato e defina a próxima ação."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(submit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
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
                    <ServiceCombobox
                      id="service"
                      services={catalogServices}
                      serviceId={serviceId ?? null}
                      serviceName={serviceName ?? ""}
                      onSelect={applyCatalogService}
                      onClear={() =>
                        setValue("serviceId", null, { shouldDirty: true })
                      }
                      onNameChange={(name) =>
                        setValue("service", name, { shouldDirty: true })
                      }
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
                  {priceWarning ? (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {priceWarning}
                    </p>
                  ) : null}
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
                    <Controller
                      name="nextAction"
                      control={control}
                      render={({ field }) => (
                        <SuggestInput
                          id="nextAction"
                          placeholder="Ex.: Enviar proposta"
                          suggestions={suggestionsQuery.data?.nextActions ?? []}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      )}
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

            <DialogFooter className="shrink-0 border-t border-border bg-muted/20 px-6 py-4">
              <Button type="button" variant="outline" onClick={requestClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : lead ? "Salvar alterações" : "Criar lead"}
              </Button>
            </DialogFooter>
          </form>

          {discardOpen ? (
            <div className="absolute inset-0 z-[70] flex items-center justify-center bg-background/60 p-6 backdrop-blur-sm">
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="discard-title"
                aria-describedby="discard-desc"
                className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-lg"
              >
                <div className="space-y-1">
                  <p id="discard-title" className="text-base font-semibold">
                    Descartar alterações?
                  </p>
                  <p id="discard-desc" className="text-sm text-muted-foreground">
                    As informações preenchidas serão perdidas.
                  </p>
                </div>
                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDiscardOpen(false)}
                  >
                    Continuar editando
                  </Button>
                  <Button type="button" variant="destructive" onClick={confirmDiscard}>
                    Descartar
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
