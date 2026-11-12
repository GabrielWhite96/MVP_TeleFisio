import { describe, expect, it, vi, beforeEach } from 'vitest'

const isNativePlatform = vi.fn(() => false)

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
    getPlatform: () => (isNativePlatform() ? 'ios' : 'web'),
  },
}))

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(async () => ({ remove: vi.fn() })),
    getLaunchUrl: vi.fn(async () => undefined),
  },
}))

import {
  pathFromDeepLinkUrl,
  navigateFromDeepLinkUrl,
  registerDeepLinkNavigator,
} from '@/shared/native/deep-links'
import { getPublicOrigin, buildPublicUrl } from '@/shared/native/origin'

describe('pathFromDeepLinkUrl', () => {
  it('accepts relative paths', () => {
    expect(pathFromDeepLinkUrl('/auth/reset-password?x=1')).toBe('/auth/reset-password?x=1')
  })

  it('parses https links on the public site', () => {
    expect(pathFromDeepLinkUrl('https://fisionotes.com.br/auth/invite/abc#tok')).toBe(
      '/auth/invite/abc#tok'
    )
    expect(pathFromDeepLinkUrl('https://www.fisionotes.com.br/physio/agenda?google=connected')).toBe(
      '/physio/agenda?google=connected'
    )
  })

  it('parses custom scheme links', () => {
    expect(pathFromDeepLinkUrl('fisionotes://auth/login')).toBe('/auth/login')
  })

  it('rejects unknown hosts', () => {
    expect(pathFromDeepLinkUrl('https://evil.example/auth/login')).toBeNull()
  })
})

describe('navigateFromDeepLinkUrl', () => {
  it('calls the registered navigator', () => {
    const nav = vi.fn()
    registerDeepLinkNavigator(nav)
    expect(navigateFromDeepLinkUrl('https://fisionotes.com.br/patient/dashboard')).toBe(true)
    expect(nav).toHaveBeenCalledWith('/patient/dashboard')
    registerDeepLinkNavigator(null)
  })
})

describe('getPublicOrigin', () => {
  beforeEach(() => {
    isNativePlatform.mockReturnValue(false)
  })

  it('keeps localhost for web development', () => {
    expect(window.location.hostname).toMatch(/localhost|127\.0\.0\.1/)
    expect(getPublicOrigin()).toBe(window.location.origin)
  })

  it('uses the public site URL on native', () => {
    isNativePlatform.mockReturnValue(true)
    expect(getPublicOrigin()).toBe('https://fisionotes.com.br')
    expect(buildPublicUrl('/auth/invite/t')).toBe('https://fisionotes.com.br/auth/invite/t')
  })
})
