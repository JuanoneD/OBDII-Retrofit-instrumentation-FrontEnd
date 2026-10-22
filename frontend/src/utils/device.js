export function formatMacInput(value) {
  const hexadecimal = String(value ?? '')
    .replace(/[^0-9a-f]/gi, '')
    .slice(0, 12)
    .toUpperCase()

  return hexadecimal.match(/.{1,2}/g)?.join(':') || ''
}

export function isValidMac(value) {
  return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(String(value).trim())
}

export function normalizeMac(value) {
  const formatted = formatMacInput(value)
  return isValidMac(formatted) ? formatted : ''
}
