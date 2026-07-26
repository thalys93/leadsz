import api from "@/services/api"

export const AVATAR_UPLOAD_PRESET = "cademeurango_avatars"

export type CloudinarySignature = {
  timestamp: number
  signature: string
  public_id: string
  api_key: string
  cloud_name: string
  upload_preset: string
  display_name?: string
}

export async function getCloudinarySignature(payload: {
  id: string
  uploadPreset: string
  displayName?: string
}) {
  const { data } = await api.get<CloudinarySignature>(
    "storage/cloudinary-signature",
    {
      params: {
        id: payload.id,
        uploadPreset: payload.uploadPreset,
        displayName: payload.displayName,
      },
    }
  )
  return data
}

export async function uploadAvatarToCloudinary(file: File, userId: string) {
  const publicId = `leadsz_avatar_${userId}`
  const signed = await getCloudinarySignature({
    id: publicId,
    uploadPreset: AVATAR_UPLOAD_PRESET,
    displayName: file.name,
  })

  const form = new FormData()
  form.append("file", file)
  form.append("api_key", signed.api_key)
  form.append("timestamp", String(signed.timestamp))
  form.append("signature", signed.signature)
  form.append("public_id", signed.public_id)
  form.append("upload_preset", signed.upload_preset)
  if (signed.display_name) {
    form.append("display_name", signed.display_name)
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloud_name}/image/upload`,
    { method: "POST", body: form }
  )

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(body || "Falha no upload do Cloudinary")
  }

  const result = (await response.json()) as { secure_url?: string; url?: string }
  const url = result.secure_url || result.url
  if (!url) throw new Error("Cloudinary não retornou URL")
  return url
}
