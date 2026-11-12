import { describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  },
}))

import { getNativePlatform, isNativeApp } from '@/shared/native/platform'
import { getSeoForPath } from '@/shared/seo/pages'

describe('native platform helpers', () => {
  it('reports web when Capacitor is not native', () => {
    expect(isNativeApp()).toBe(false)
    expect(getNativePlatform()).toBe('web')
  })
})

describe('legal page SEO', () => {
  it('exposes privacy and terms metadata without indexing flags beyond private SEO', () => {
    const privacy = getSeoForPath('/privacidade')
    expect(privacy.title).toContain('Privacidade')
    expect(privacy.index).toBe(false)
    expect(privacy.canonicalPath).toBe('/privacidade')

    const terms = getSeoForPath('/termos')
    expect(terms.title).toContain('Termos')
    expect(terms.index).toBe(false)
    expect(terms.canonicalPath).toBe('/termos')
  })
})
