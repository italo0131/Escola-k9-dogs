export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isPhone(value: string) {
  return /^[0-9+()\-\s]{8,20}$/.test(value)
}

export function required(value: string) {
  return value.trim().length > 0
}
