import { dictionaries, type Locale } from './dictionaries'

let currentLocale: Locale = 'pt'

export function setLocale(locale: Locale) {
  currentLocale = locale
}

export function getLocale(): Locale {
  return currentLocale
}

export function t(path: string): string {
  const dict = dictionaries[currentLocale] as unknown as Record<string, unknown>
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, dict)
  return typeof value === 'string' ? value : path
}

export { dictionaries }
export type { Locale }
