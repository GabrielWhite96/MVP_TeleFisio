import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const isNativePlatform = vi.fn(() => false)

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
    getPlatform: () => (isNativePlatform() ? 'ios' : 'web'),
  },
}))

import { getNativePlatform, isNativeApp, isNativeUi } from '@/shared/native/platform'
import { getSeoForPath } from '@/shared/seo/pages'

describe('native platform helpers', () => {
  beforeEach(() => {
    isNativePlatform.mockReturnValue(false)
    vi.stubEnv('VITE_PREVIEW_NATIVE_UI', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reports web when Capacitor is not native', () => {
    expect(isNativeApp()).toBe(false)
    expect(isNativeUi()).toBe(false)
    expect(getNativePlatform()).toBe('web')
  })

  it('treats Capacitor shells as native UI', () => {
    isNativePlatform.mockReturnValue(true)
    expect(isNativeApp()).toBe(true)
    expect(isNativeUi()).toBe(true)
    expect(getNativePlatform()).toBe('ios')
  })

  it('enables native UI preview in DEV via VITE_PREVIEW_NATIVE_UI', () => {
    vi.stubEnv('VITE_PREVIEW_NATIVE_UI', '1')
    expect(isNativeApp()).toBe(false)
    expect(isNativeUi()).toBe(true)
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
