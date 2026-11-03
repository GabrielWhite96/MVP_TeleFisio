import { describe, expect, it } from 'vitest'
import {
  getSeoForPath,
  buildRobotsTxt,
  buildSitemapXml,
  buildLandingPrerenderHtml,
  buildPrerenderHtmlForPath,
  buildSeoHeadHtml,
  buildNetlifyRedirects,
  INDEXABLE_SEO_PAGES,
} from '@/shared/seo/pages'
import { sanitizeAnalyticsPath } from '@/shared/lib/analytics'
import { DEFAULT_SITE_URL, SEO_TITLE } from '@/shared/config/site'
import { pt } from '@/shared/config/i18n/pt'
import { ROUTES } from '@/shared/config/routes'

describe('SEO', () => {
  it('uses the purchased domain as the public site URL', () => {
    expect(DEFAULT_SITE_URL).toBe('https://fisionotes.com.br')
  })

  it('indexes public marketing pages and keeps private areas out', () => {
    expect(getSeoForPath('/').index).toBe(true)
    expect(getSeoForPath('/').title).toBe(SEO_TITLE)
    expect(getSeoForPath(ROUTES.seo.sistema).index).toBe(true)
    expect(getSeoForPath(ROUTES.seo.clinicas).index).toBe(true)
    expect(getSeoForPath(ROUTES.seo.prontuario).index).toBe(true)
    expect(getSeoForPath(ROUTES.seo.ferramentas).index).toBe(true)
    expect(getSeoForPath('/assinar').index).toBe(false)
    expect(getSeoForPath('/auth/login').index).toBe(false)
    expect(getSeoForPath('/physio/dashboard').index).toBe(false)
    expect(getSeoForPath('/patient/appointments/abc').index).toBe(false)
  })

  it('prioritizes sistema para fisioterapeutas in home metadata', () => {
    expect(SEO_TITLE.toLowerCase()).toContain('sistema para fisioterapeutas')
    expect(getSeoForPath('/').description.toLowerCase()).toContain('sistema para fisioterapeutas')
    expect(buildSeoHeadHtml('/')).toContain('sistema para fisioterapeutas')
  })

  it('keeps private areas out of robots and lists only indexable URLs in sitemap', () => {
    const robots = buildRobotsTxt('https://fisionotes.com.br')
    expect(robots).toContain('Disallow: /physio/')
    expect(robots).toContain('Disallow: /patient/')
    expect(robots).toContain('Disallow: /assinar')
    expect(robots).toContain('Allow: /sistema-para-fisioterapeutas')
    expect(robots).toContain('Sitemap: https://fisionotes.com.br/sitemap.xml')

    const sitemap = buildSitemapXml('https://fisionotes.com.br', '2026-11-03')
    expect(sitemap).toContain('https://fisionotes.com.br/')
    expect(sitemap).toContain('https://fisionotes.com.br/sistema-para-fisioterapeutas')
    expect(sitemap).toContain('https://fisionotes.com.br/software-para-clinicas-de-fisioterapia')
    expect(sitemap).toContain('https://fisionotes.com.br/prontuario-eletronico-fisioterapeutas')
    expect(sitemap).toContain('https://fisionotes.com.br/ferramentas-para-fisioterapeutas')
    expect(sitemap).not.toContain('/physio/')
    expect(sitemap).not.toContain('/auth/')
    expect(sitemap).not.toContain('/assinar')
    expect(INDEXABLE_SEO_PAGES).toHaveLength(5)
  })

  it('prerenders keyword-rich landing copy for crawlers', () => {
    const html = buildLandingPrerenderHtml()
    expect(html).toContain(pt.landing.heroTitle)
    expect(html).toContain('sistema para fisioterapeutas')
    expect(html).toContain(pt.landing.audienceTitle)
    expect(html).toContain(pt.landing.faq6Q)
  })

  it('prerenders unique intent pages with their own H1', () => {
    const html = buildPrerenderHtmlForPath(ROUTES.seo.prontuario)
    expect(html).toContain(pt.seoPages.prontuario.h1)
    expect(html).toContain(pt.seoPages.prontuario.sections[0].title)
    expect(html).not.toContain(pt.landing.heroTitle)
  })

  it('builds distinct head tags per indexable path', () => {
    const home = buildSeoHeadHtml('/')
    const intent = buildSeoHeadHtml(ROUTES.seo.sistema)
    expect(home).toContain(`<link rel="canonical" href="https://fisionotes.com.br/" />`)
    expect(intent).toContain(`canonical" href="https://fisionotes.com.br${ROUTES.seo.sistema}"`)
    expect(intent).not.toContain(`canonical" href="https://fisionotes.com.br${ROUTES.seo.sistema}/"`)
    expect(intent).toContain(pt.seoPages.sistema.title)
    expect(intent).toContain('application/ld+json')
  })

  it('emits Netlify redirects that avoid trailing-slash loops on SEO pages', () => {
    const redirects = buildNetlifyRedirects()
    expect(redirects).toContain(`${ROUTES.seo.sistema}/  ${ROUTES.seo.sistema}  301!`)
    expect(redirects).toContain(`${ROUTES.seo.sistema}  ${ROUTES.seo.sistema}.html  200`)
    expect(redirects).toContain(`${ROUTES.seo.clinicas}  ${ROUTES.seo.clinicas}.html  200`)
    expect(redirects).toContain('/*    /index.html   200')
    expect(buildSitemapXml('https://fisionotes.com.br')).not.toMatch(
      /fisionotes\.com\.br\/sistema-para-fisioterapeutas\//
    )
  })

  it('strips ids from analytics paths', () => {
    expect(sanitizeAnalyticsPath('/physio/patients/11111111-2222-3333-4444-555555555555')).toBe(
      '/physio/patients/:id'
    )
    expect(sanitizeAnalyticsPath('/auth/invite/abcdefghijklmnopqrstuvwxyz123')).toBe('/auth/invite/:id')
  })
})
