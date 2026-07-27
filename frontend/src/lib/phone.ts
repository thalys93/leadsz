export type PhoneCountry = {
  iso: string
  name: string
  dialCode: string
  maxNationalLength: number
  minNationalLength: number
}

export const DEFAULT_PHONE_COUNTRY = "BR"

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "BR", name: "Brasil", dialCode: "55", minNationalLength: 10, maxNationalLength: 11 },
  { iso: "AR", name: "Argentina", dialCode: "54", minNationalLength: 10, maxNationalLength: 11 },
  { iso: "BO", name: "Bolívia", dialCode: "591", minNationalLength: 8, maxNationalLength: 8 },
  { iso: "CL", name: "Chile", dialCode: "56", minNationalLength: 9, maxNationalLength: 9 },
  { iso: "CO", name: "Colômbia", dialCode: "57", minNationalLength: 10, maxNationalLength: 10 },
  { iso: "CR", name: "Costa Rica", dialCode: "506", minNationalLength: 8, maxNationalLength: 8 },
  { iso: "CU", name: "Cuba", dialCode: "53", minNationalLength: 8, maxNationalLength: 8 },
  { iso: "DO", name: "Rep. Dominicana", dialCode: "1", minNationalLength: 10, maxNationalLength: 10 },
  { iso: "EC", name: "Equador", dialCode: "593", minNationalLength: 9, maxNationalLength: 9 },
  { iso: "SV", name: "El Salvador", dialCode: "503", minNationalLength: 8, maxNationalLength: 8 },
  { iso: "GT", name: "Guatemala", dialCode: "502", minNationalLength: 8, maxNationalLength: 8 },
  { iso: "HN", name: "Honduras", dialCode: "504", minNationalLength: 8, maxNationalLength: 8 },
  { iso: "MX", name: "México", dialCode: "52", minNationalLength: 10, maxNationalLength: 10 },
  { iso: "NI", name: "Nicarágua", dialCode: "505", minNationalLength: 8, maxNationalLength: 8 },
  { iso: "PA", name: "Panamá", dialCode: "507", minNationalLength: 7, maxNationalLength: 8 },
  { iso: "PY", name: "Paraguai", dialCode: "595", minNationalLength: 9, maxNationalLength: 9 },
  { iso: "PE", name: "Peru", dialCode: "51", minNationalLength: 9, maxNationalLength: 9 },
  { iso: "PT", name: "Portugal", dialCode: "351", minNationalLength: 9, maxNationalLength: 9 },
  { iso: "UY", name: "Uruguai", dialCode: "598", minNationalLength: 8, maxNationalLength: 9 },
  { iso: "VE", name: "Venezuela", dialCode: "58", minNationalLength: 10, maxNationalLength: 10 },
  { iso: "US", name: "Estados Unidos", dialCode: "1", minNationalLength: 10, maxNationalLength: 10 },
  { iso: "CA", name: "Canadá", dialCode: "1", minNationalLength: 10, maxNationalLength: 10 },
  { iso: "ES", name: "Espanha", dialCode: "34", minNationalLength: 9, maxNationalLength: 9 },
  { iso: "FR", name: "França", dialCode: "33", minNationalLength: 9, maxNationalLength: 9 },
  { iso: "DE", name: "Alemanha", dialCode: "49", minNationalLength: 10, maxNationalLength: 11 },
  { iso: "IT", name: "Itália", dialCode: "39", minNationalLength: 9, maxNationalLength: 10 },
  { iso: "GB", name: "Reino Unido", dialCode: "44", minNationalLength: 10, maxNationalLength: 10 },
  { iso: "AO", name: "Angola", dialCode: "244", minNationalLength: 9, maxNationalLength: 9 },
  { iso: "MZ", name: "Moçambique", dialCode: "258", minNationalLength: 9, maxNationalLength: 9 },
  { iso: "CV", name: "Cabo Verde", dialCode: "238", minNationalLength: 7, maxNationalLength: 7 },
]

export const PHONE_INVALID_MESSAGE =
  "Informe um telefone válido, ex.: +55 51 99148-5930"

export function getPhoneCountry(iso: string): PhoneCountry {
  return (
    PHONE_COUNTRIES.find((country) => country.iso === iso) ??
    PHONE_COUNTRIES.find((country) => country.iso === DEFAULT_PHONE_COUNTRY)!
  )
}

export function onlyPhoneDigits(value: string): string {
  return value.replace(/\D/g, "")
}

function nationalInRange(country: PhoneCountry, nationalDigits: string): boolean {
  return (
    nationalDigits.length >= country.minNationalLength &&
    nationalDigits.length <= country.maxNationalLength
  )
}

function sortedCountriesByDialCode(): PhoneCountry[] {
  return [...PHONE_COUNTRIES].sort((a, b) => {
    const byLength = b.dialCode.length - a.dialCode.length
    if (byLength !== 0) return byLength
    const rank = (iso: string) =>
      iso === DEFAULT_PHONE_COUNTRY ? 0 : iso === "US" ? 1 : 2
    return rank(a.iso) - rank(b.iso)
  })
}

function matchDialCode(
  digits: string,
  countries: PhoneCountry[]
): { iso: string; nationalDigits: string } | null {
  for (const country of countries) {
    if (!digits.startsWith(country.dialCode)) continue
    const nationalDigits = digits
      .slice(country.dialCode.length)
      .slice(0, country.maxNationalLength)
    if (!nationalInRange(country, nationalDigits)) continue
    if (digits.length - country.dialCode.length > country.maxNationalLength) continue
    return { iso: country.iso, nationalDigits }
  }
  return null
}

export function formatNationalNumber(digits: string, iso: string): string {
  const country = getPhoneCountry(iso)
  const d = onlyPhoneDigits(digits).slice(0, country.maxNationalLength)

  if (iso === "BR") {
    if (!d) return ""
    if (d.length <= 2) return d
    if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`
    if (d.length <= 10) {
      return `${d.slice(0, 2)} ${d.slice(2, 6)}-${d.slice(6)}`
    }
    return `${d.slice(0, 2)} ${d.slice(2, 7)}-${d.slice(7)}`
  }

  if (!d) return ""
  if (d.length <= 4) return d
  return `${d.slice(0, d.length - 4)}-${d.slice(-4)}`
}

export function composePhone(iso: string, nationalDigits: string): string {
  const digits = onlyPhoneDigits(nationalDigits)
  if (!digits) return ""
  const country = getPhoneCountry(iso)
  return `+${country.dialCode} ${formatNationalNumber(digits, iso)}`
}

export function parsePhone(
  value: string,
  preferredIso = DEFAULT_PHONE_COUNTRY
): {
  iso: string
  nationalDigits: string
} {
  const trimmed = value.trim()
  if (!trimmed) {
    return { iso: preferredIso, nationalDigits: "" }
  }

  const digits = onlyPhoneDigits(trimmed)
  if (!digits) {
    return { iso: preferredIso, nationalDigits: "" }
  }

  const preferred = getPhoneCountry(preferredIso)
  const sorted = sortedCountriesByDialCode()

  if (trimmed.startsWith("+")) {
    return (
      matchDialCode(digits, sorted) ?? {
        iso: preferred.iso,
        nationalDigits: digits.slice(0, preferred.maxNationalLength),
      }
    )
  }

  const preferredWithDial = matchDialCode(digits, [preferred])
  if (preferredWithDial) return preferredWithDial

  if (nationalInRange(preferred, digits)) {
    return { iso: preferred.iso, nationalDigits: digits }
  }

  if (digits.length > preferred.maxNationalLength) {
    const international = matchDialCode(digits, sorted)
    if (international) return international
  }

  return {
    iso: preferred.iso,
    nationalDigits: digits.slice(0, preferred.maxNationalLength),
  }
}

export function formatPhone(value: string, preferredIso = DEFAULT_PHONE_COUNTRY): string {
  const { iso, nationalDigits } = parsePhone(value, preferredIso)
  return composePhone(iso, nationalDigits)
}

export function isValidPhone(value: string, preferredIso = DEFAULT_PHONE_COUNTRY): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  const { iso, nationalDigits } = parsePhone(trimmed, preferredIso)
  return nationalInRange(getPhoneCountry(iso), nationalDigits)
}

export function isOptionalPhoneValid(
  value: string,
  preferredIso = DEFAULT_PHONE_COUNTRY
): boolean {
  const trimmed = value.trim()
  return trimmed === "" || isValidPhone(trimmed, preferredIso)
}
