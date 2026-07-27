import assert from "node:assert/strict"
import {
  formatPhone,
  isValidPhone,
  parsePhone,
} from "./phone"

const cases: Array<{
  input: string
  iso: string
  nationalDigits: string
}> = [
  { input: "51991485930", iso: "BR", nationalDigits: "51991485930" },
  { input: "11999999999", iso: "BR", nationalDigits: "11999999999" },
  { input: "(51) 99148-5930", iso: "BR", nationalDigits: "51991485930" },
  { input: "51 99148-5930", iso: "BR", nationalDigits: "51991485930" },
  { input: "5551991485930", iso: "BR", nationalDigits: "51991485930" },
  { input: "55 51 99148-5930", iso: "BR", nationalDigits: "51991485930" },
  { input: "+55 51 99148-5930", iso: "BR", nationalDigits: "51991485930" },
  { input: "+55 (51) 99148-5930", iso: "BR", nationalDigits: "51991485930" },
  { input: "+51 991485930", iso: "PE", nationalDigits: "991485930" },
  { input: "+1 2125551234", iso: "US", nationalDigits: "2125551234" },
]

for (const item of cases) {
  const parsed = parsePhone(item.input)
  assert.equal(parsed.iso, item.iso, `iso for ${item.input}`)
  assert.equal(
    parsed.nationalDigits,
    item.nationalDigits,
    `national for ${item.input}`
  )
  assert.equal(isValidPhone(formatPhone(item.input)), true, `valid ${item.input}`)
}

assert.equal(formatPhone("51991485930"), "+55 51 99148-5930")
assert.equal(formatPhone("11999999999"), "+55 11 99999-9999")
assert.equal(formatPhone("+55 51 99148-5930"), "+55 51 99148-5930")

console.log("phone.self-check: ok")
