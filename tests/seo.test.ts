import { describe, expect, it } from 'vitest'
import { getSeoForPath, buildRobotsTxt, buildSitemapXml, buildLandingPrerenderHtml } from '@/shared/seo/pages'
import { sanitizeAnalyticsPath } from '@/shared/lib/analytics'
import { DEFAULT_SITE_URL, SEO_TITLE } from '@/shared/config/site'
import { pt } from '@/shared/config/i18n/pt'

describe('SEO', () => {
  it('uses the purchased domain as the public site URL', () => {
    expect(DEFAULT_SITE_URL).toBe('https://fisionotes.com.br')
  })

  it('indexes only the public landing page', () => {
    expect(getSeoForPath('/').index).toBe(true)
    expect(getSeoForPath('/').title).toBe(SEO_TITLE)
    expect(getSeoForPath('/assinar').index).toBe(false)
    expect(getSeoForPath('/auth/login').index).toBe(false)
    expect(getSeoForPath('/physio/dashboard').index).toBe(false)
    expect(getSeoForPath('/patient/appointments/abc').index).toBe(false)
  })

  it('keeps private areas out of robots and sitemap', () => {
    const robots = buildRobotsTxt('https://fisionotes.com.br')
    expect(robots).toContain('Disallow: /physio/')
    expect(robots).toContain('Disallow: /patient/')
    expect(robots).toContain('Sitemap: https://fisionotes.com.br/sitemap.xml')

    const sitemap = buildSitemapXml('https://fisionotes.com.br', '2026-11-02')
    expect(sitemap).toContain('https://fisionotes.com.br/')
    expect(sitemap).not.toContain('/physio/')
    expect(sitemap).not.toContain('/auth/')
  })

  it('prerenders keyword-rich landing copy for crawlers', () => {
    const html = buildLandingPrerenderHtml()
    expect(html).toContain(pt.landing.heroTitle)
    expect(html).toContain('sistema de organização para fisioterapeutas')
    expect(html).toContain(pt.landing.faq6Q)
  })

  it('strips ids from analytics paths', () => {
    expect(sanitizeAnalyticsPath('/physio/patients/11111111-2222-3333-4444-555555555555')).toBe(
      '/physio/patients/:id'
    )
    expect(sanitizeAnalyticsPath('/auth/invite/abcdefghijklmnopqrstuvwxyz123')).toBe('/auth/invite/:id')
  })
})
