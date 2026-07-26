import { useRef, useState, type ComponentType, type SVGProps } from "react"
import {
  Briefcase,
  Camera,
  Globe,
  Loader2,
  Lock,
  Mail,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateMeRequest } from "@/services/auth"
import { uploadAvatarToCloudinary } from "@/services/storage"
import { useAuthStore } from "@/store/use-auth-store"
import {
  formatPhone,
  isOptionalPhoneValid,
  PHONE_INVALID_MESSAGE,
} from "@/lib/phone"
import { userInitials } from "@/lib/user-initials"
import { cn } from "@/lib/utils"

type IconType = ComponentType<SVGProps<SVGSVGElement>>

function ProfileField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  readOnly,
  hint,
  error,
  className,
}: {
  id: string
  label: string
  icon: IconType
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  type?: string
  autoComplete?: string
  readOnly?: boolean
  hint?: string
  error?: string
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <span
          className={cn(
            "pointer-events-none absolute left-0 top-0 flex h-10 w-10 items-center justify-center",
            readOnly ? "text-muted-foreground/70" : "text-muted-foreground"
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <Input
          id={id}
          type={type}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder}
          autoComplete={autoComplete}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          aria-invalid={Boolean(error)}
          className={cn(
            "pl-10 transition-colors",
            error && "border-destructive focus-visible:ring-destructive",
            readOnly &&
              "cursor-default bg-muted/50 text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
        />
        {readOnly ? (
          <span className="pointer-events-none absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-muted-foreground/60">
            <Lock className="size-3.5" aria-hidden />
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(() => user?.name ?? "")
  const [jobTitle, setJobTitle] = useState(() => user?.jobTitle ?? "")
  const [phone, setPhone] = useState(() => formatPhone(user?.phone ?? ""))
  const [website, setWebsite] = useState(() => user?.website ?? "")
  const [avatarUrl, setAvatarUrl] = useState(() => user?.avatar_url ?? "")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [phoneError, setPhoneError] = useState("")

  async function handleAvatarFile(file: File | undefined) {
    if (!file || !user?.id) return
    if (!file.type.startsWith("image/")) {
      toast.error("Envie uma imagem")
      return
    }
    setUploading(true)
    try {
      const url = await uploadAvatarToCloudinary(file, user.id)
      setAvatarUrl(url)
      toast.success("Avatar enviado")
    } catch {
      toast.error("Falha ao enviar avatar")
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Informe seu nome")
      return
    }
    if (!isOptionalPhoneValid(phone)) {
      setPhoneError(PHONE_INVALID_MESSAGE)
      return
    }
    setPhoneError("")
    setSaving(true)
    try {
      const result = await updateMeRequest({
        name: name.trim(),
        jobTitle: jobTitle.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      updateUser({
        name: result.user.name,
        jobTitle: result.user.jobTitle ?? null,
        phone: result.user.phone ?? null,
        website: result.user.website ?? null,
        avatar_url: result.user.avatar_url ?? null,
      })
      toast.success("Perfil atualizado")
    } catch {
      toast.error("Não foi possível salvar o perfil")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Perfil
        </h1>
        <p className="mx-auto mt-1 max-w-md text-muted-foreground">
          Complete suas informações. Elas aparecem na sua conta e no site ou
          portfólio usado ao gerar templates.
        </p>
      </div>

      <div className="space-y-8 rounded-xl border border-border bg-card/70 p-6 sm:p-8">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setDragging(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              void handleAvatarFile(e.dataTransfer.files?.[0])
            }}
            className={cn(
              "group relative size-28 rounded-full outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring",
              dragging && "ring-2 ring-ring",
              uploading && "pointer-events-none"
            )}
            aria-label="Enviar foto de perfil"
          >
            <Avatar className="size-28 border-2 border-border shadow-sm">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={name || user?.name} />
              ) : null}
              <AvatarFallback className="bg-accent text-2xl font-semibold text-ember">
                {userInitials(name || user?.name)}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                (dragging || uploading) && "opacity-100"
              )}
            >
              {uploading ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <>
                  <Camera className="size-6" />
                  <span className="text-xs font-medium">Alterar foto</span>
                </>
              )}
            </span>
          </button>
          <p className="text-xs text-muted-foreground">
            Clique ou arraste uma imagem para o avatar
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleAvatarFile(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <ProfileField
            id="profile-name"
            label="Nome"
            icon={UserRound}
            value={name}
            onChange={setName}
            autoComplete="name"
            placeholder="Seu nome completo"
          />
          <ProfileField
            id="profile-job"
            label="Cargo"
            icon={Briefcase}
            value={jobTitle}
            onChange={setJobTitle}
            autoComplete="organization-title"
            placeholder="Ex.: Head de Vendas"
          />
          <ProfileField
            id="profile-email"
            label="E-mail"
            icon={Mail}
            type="email"
            value={user?.email ?? ""}
            readOnly
            hint="O e-mail não pode ser alterado"
          />
          <div className="space-y-2">
            <Label htmlFor="profile-phone" className="text-sm font-medium">
              Telefone
            </Label>
            <PhoneInput
              id="profile-phone"
              value={phone}
              onChange={(value) => {
                setPhone(value)
                if (phoneError) setPhoneError("")
              }}
              aria-invalid={Boolean(phoneError)}
            />
            {phoneError ? (
              <p className="text-xs text-destructive">{phoneError}</p>
            ) : null}
          </div>
          <ProfileField
            id="profile-website"
            label="Site ou portfólio"
            icon={Globe}
            type="url"
            value={website}
            onChange={setWebsite}
            autoComplete="url"
            placeholder="https://seusite.com.br"
            hint="Usado na geração de templates"
            className="sm:col-span-2"
          />
        </div>

        <div className="flex justify-center pt-1">
          <Button
            onClick={handleSave}
            disabled={saving || uploading}
            className="min-w-40"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </div>
  )
}
