import { BRAND_NAME, BRAND_LOGOS } from '../config/brand'
import { SAAS_PLAN } from '../config/saas-plan'
import { pt } from '../config/i18n/pt'
import {
  getCanonicalUrl,
  getOgImageUrl,
  getSiteUrl,
  SEO_DESCRIPTION,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SEO_KEYWORDS,
  SEO_TITLE,
  SITE_LOCALE,
} from '../config/site'

export interface SeoPage {
  title: string
  description: string
  path: string
  canonicalPath: string
  index: boolean
  keywords?: string
  jsonLd?: 'home' | 'article' | 'none'
}

type SeoIntentKey = 'sistema' | 'clinicas' | 'prontuario' | 'ferramentas'

const INTENT_ORDER: SeoIntentKey[] = ['sistema', 'clinicas', 'prontuario', 'ferramentas']

function intentContent(key: SeoIntentKey) {
  return pt.seoPages[key]
}

export const HOME_SEO: SeoPage = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  path: '/',
  canonicalPath: '/',
  index: true,
  keywords: SEO_KEYWORDS.join(', '),
  jsonLd: 'home',
}

export const INDEXABLE_SEO_PAGES: SeoPage[] = [
  HOME_SEO,
  ...INTENT_ORDER.map((key) => {
    const page = intentContent(key)
    return {
      title: page.title,
      description: page.description,
      path: page.path,
      canonicalPath: page.path,
      index: true,
      keywords: SEO_KEYWORDS.join(', '),
      jsonLd: 'article' as const,
    }
  }),
]

const PRIVATE_SEO: SeoPage = {
  title: BRAND_NAME,
  description: SEO_DESCRIPTION,
  path: '/',
  canonicalPath: '/',
  index: false,
  jsonLd: 'none',
}

export function getSeoForPath(pathname: string): SeoPage {
  const path = (pathname.split('?')[0] || '/').replace(/\/$/, '') || '/'
  const indexed = INDEXABLE_SEO_PAGES.find((page) => page.path === path)
  if (indexed) return indexed

  if (path === '/assinar') {
    return {
      ...PRIVATE_SEO,
      path,
      canonicalPath: '/',
      title: `Assinar o ${BRAND_NAME}`,
      description: `Assine o ${BRAND_NAME}, sistema para fisioterapeutas, por ${SAAS_PLAN.amountLabel}/${SAAS_PLAN.interval}. Agenda, prontuário eletrônico, financeiro e portal do paciente.`,
    }
  }

  if (path === '/privacidade') {
    return {
      ...PRIVATE_SEO,
      path,
      canonicalPath: '/privacidade',
      title: `Política de Privacidade | ${BRAND_NAME}`,
      description: `Política de Privacidade do ${BRAND_NAME}: tratamento de dados pessoais e de saúde, LGPD e direitos do titular.`,
    }
  }

  if (path === '/termos') {
    return {
      ...PRIVATE_SEO,
      path,
      canonicalPath: '/termos',
      title: `Termos de Uso | ${BRAND_NAME}`,
      description: `Termos de Uso do ${BRAND_NAME}: condições de uso da plataforma de gestão e tele-fisioterapia.`,
    }
  }

  return {
    ...PRIVATE_SEO,
    path,
    canonicalPath: path,
    title: BRAND_NAME,
  }
}

export function buildSoftwareJsonLd() {
  const url = getSiteUrl()
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${url}/#organization`,
        name: BRAND_NAME,
        url,
        logo: `${url}${BRAND_LOGOS.horizontal}`,
        description: SEO_DESCRIPTION,
      },
      {
        '@type': 'WebSite',
        '@id': `${url}/#website`,
        url,
        name: BRAND_NAME,
        description: SEO_DESCRIPTION,
        inLanguage: 'pt-BR',
        publisher: { '@id': `${url}/#organization` },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${url}/#app`,
        name: BRAND_NAME,
        url,
        image: getOgImageUrl(),
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Sistema para fisioterapeutas',
        operatingSystem: 'Web',
        inLanguage: 'pt-BR',
        description: SEO_DESCRIPTION,
        featureList: [
          pt.landing.featureAgendaTitle,
          pt.landing.featureChartTitle,
          pt.landing.featurePlanTitle,
          pt.landing.featureBillingTitle,
          pt.landing.featurePortalTitle,
          pt.landing.toolsTitle,
        ],
        offers: {
          '@type': 'Offer',
          name: SAAS_PLAN.name,
          price: '29.90',
          priceCurrency: SAAS_PLAN.currency,
          url: `${url}/assinar`,
          availability: 'https://schema.org/InStock',
          description: `${SAAS_PLAN.trialDays} dias grátis; depois ${SAAS_PLAN.amountLabel}/${SAAS_PLAN.interval}`,
        },
        publisher: { '@id': `${url}/#organization` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}/#faq`,
        mainEntity: [
          { q: pt.landing.faq1Q, a: pt.landing.faq1A },
          { q: pt.landing.faq2Q, a: pt.landing.faq2A },
          { q: pt.landing.faq3Q, a: pt.landing.faq3A },
          { q: pt.landing.faq4Q, a: pt.landing.faq4A },
          { q: pt.landing.faq5Q, a: pt.landing.faq5A },
          { q: pt.landing.faq6Q, a: pt.landing.faq6A },
        ].map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  }
}

export function buildArticleJsonLd(seo: SeoPage) {
  const url = getSiteUrl()
  const pageUrl = getCanonicalUrl(seo.canonicalPath)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${url}/#organization`,
        name: BRAND_NAME,
        url,
        logo: `${url}${BRAND_LOGOS.horizontal}`,
      },
      {
        '@type': 'WebPage',
        '@id': `${pageUrl}#webpage`,
        url: pageUrl,
        name: seo.title,
        description: seo.description,
        inLanguage: 'pt-BR',
        isPartOf: { '@id': `${url}/#website` },
        about: { '@id': `${url}/#app` },
        publisher: { '@id': `${url}/#organization` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Início',
            item: `${url}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: seo.title.split('|')[0]?.trim() || seo.title,
            item: pageUrl,
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${url}/#app`,
        name: BRAND_NAME,
        url,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Sistema para fisioterapeutas',
        operatingSystem: 'Web',
        description: SEO_DESCRIPTION,
        offers: {
          '@type': 'Offer',
          price: '29.90',
          priceCurrency: SAAS_PLAN.currency,
          url: `${url}/assinar`,
        },
      },
    ],
  }
}

export function buildJsonLdForSeo(seo: SeoPage): unknown | null {
  if (!seo.index || seo.jsonLd === 'none') return null
  if (seo.jsonLd === 'article') return buildArticleJsonLd(seo)
  return buildSoftwareJsonLd()
}

export function buildRobotsTxt(siteUrl = getSiteUrl()): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Allow: /sistema-para-fisioterapeutas',
    'Allow: /software-para-clinicas-de-fisioterapia',
    'Allow: /prontuario-eletronico-fisioterapeutas',
    'Allow: /ferramentas-para-fisioterapeutas',
    'Disallow: /auth/',
    'Disallow: /assinar',
    'Disallow: /patient/',
    'Disallow: /physio/',
    'Disallow: /caregiver/',
    'Disallow: /admin/',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n')
}

export function buildSitemapXml(siteUrl = getSiteUrl(), lastmod = new Date().toISOString().slice(0, 10)): string {
  const urls = INDEXABLE_SEO_PAGES.map((page) => {
    const loc = page.path === '/' ? `${siteUrl}/` : `${siteUrl}${page.path}`
    const priority = page.path === '/' ? '1.0' : '0.8'
    const changefreq = page.path === '/' ? 'weekly' : 'monthly'
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n')
  })

  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join(
    '\n'
  )
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function buildSeoHeadHtml(pathname = '/'): string {
  const seo = getSeoForPath(pathname)
  const url = getCanonicalUrl(seo.canonicalPath)
  const image = getOgImageUrl()
  const robots = seo.index
    ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    : 'noindex, nofollow'
  const jsonLd = buildJsonLdForSeo(seo)
  const lines = [
    `<title>${escapeHtml(seo.title)}</title>`,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    seo.keywords ? `<meta name="keywords" content="${escapeHtml(seo.keywords)}" />` : null,
    `<meta name="robots" content="${robots}" />`,
    `<meta name="googlebot" content="${seo.index ? 'index, follow' : 'noindex, nofollow'}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<link rel="alternate" hreflang="pt-BR" href="${escapeHtml(url)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${escapeHtml(url)}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${escapeHtml(BRAND_NAME)}" />`,
    `<meta property="og:locale" content="${SITE_LOCALE}" />`,
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:image:width" content="${String(OG_IMAGE_WIDTH)}" />`,
    `<meta property="og:image:height" content="${String(OG_IMAGE_HEIGHT)}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}" />`,
    jsonLd ? `<script type="application/ld+json" id="fisionotes-jsonld">${JSON.stringify(jsonLd)}</script>` : null,
  ].filter(Boolean) as string[]

  return lines.map((line) => `    ${line}`).join('\n')
}

export function buildLandingPrerenderHtml(): string {
  const features = [
    [pt.landing.featureAgendaTitle, pt.landing.featureAgendaBody],
    [pt.landing.featureChartTitle, pt.landing.featureChartBody],
    [pt.landing.featurePlanTitle, pt.landing.featurePlanBody],
    [pt.landing.featureExercisesTitle, pt.landing.featureExercisesBody],
    [pt.landing.featureCheckInTitle, pt.landing.featureCheckInBody],
    [pt.landing.featureReportsTitle, pt.landing.featureReportsBody],
    [pt.landing.featureBillingTitle, pt.landing.featureBillingBody],
    [pt.landing.featurePortalTitle, pt.landing.featurePortalBody],
  ] as const
  const audiences = [
    [pt.landing.audienceSoloTitle, pt.landing.audienceSoloBody],
    [pt.landing.audienceClinicTitle, pt.landing.audienceClinicBody],
    [pt.landing.audienceHomeTitle, pt.landing.audienceHomeBody],
  ] as const
  const faqs = [
    [pt.landing.faq1Q, pt.landing.faq1A],
    [pt.landing.faq2Q, pt.landing.faq2A],
    [pt.landing.faq3Q, pt.landing.faq3A],
    [pt.landing.faq4Q, pt.landing.faq4A],
    [pt.landing.faq5Q, pt.landing.faq5A],
    [pt.landing.faq6Q, pt.landing.faq6A],
  ] as const

  return `
<article class="seo-prerender">
  <h1>${escapeHtml(pt.landing.heroTitle)}</h1>
  <p>${escapeHtml(pt.landing.heroSubtitle)}</p>
  <p>${escapeHtml(pt.landing.featuresSubtitle)}</p>
  <p><a href="/assinar">${escapeHtml(pt.landing.heroPrimary)}</a> · <a href="/assinar?intent=demo">${escapeHtml(pt.landing.heroDemo)}</a></p>
  <h2>${escapeHtml(pt.landing.audienceTitle)}</h2>
  <p>${escapeHtml(pt.landing.audienceSubtitle)}</p>
  <ul>
    ${audiences.map(([title, body]) => `<li><strong>${escapeHtml(title)}</strong> — ${escapeHtml(body)}</li>`).join('\n    ')}
  </ul>
  <p>${escapeHtml(pt.landing.audienceProblemBody)}</p>
  <h2>${escapeHtml(pt.landing.featuresTitle)}</h2>
  <ul>
    ${features.map(([title, body]) => `<li><strong>${escapeHtml(title)}</strong> — ${escapeHtml(body)}</li>`).join('\n    ')}
  </ul>
  <h2>${escapeHtml(pt.landing.toolsTitle)}</h2>
  <p>${escapeHtml(pt.landing.toolsSubtitle)}</p>
  <h2>${escapeHtml(pt.landing.benefitsTitle)}</h2>
  <p>${escapeHtml(pt.landing.benefitsSubtitle)}</p>
  <h2>${escapeHtml(pt.landing.pricingTitle)}</h2>
  <p>${escapeHtml(pt.landing.pricingSubtitle)} ${escapeHtml(SAAS_PLAN.amountLabel)}${escapeHtml(pt.landing.pricingAmountSuffix)}.</p>
  <h2>${escapeHtml(pt.landing.faqTitle)}</h2>
  ${faqs.map(([q, a]) => `<h3>${escapeHtml(q)}</h3>\n  <p>${escapeHtml(a)}</p>`).join('\n  ')}
  <nav aria-label="${escapeHtml(pt.landing.footerExplore)}">
    <ul>
      ${INTENT_ORDER.map((key) => {
        const page = intentContent(key)
        return `<li><a href="${escapeHtml(page.path)}">${escapeHtml(page.h1)}</a></li>`
      }).join('\n      ')}
    </ul>
  </nav>
</article>`
}

export function buildIntentPrerenderHtml(key: SeoIntentKey): string {
  const page = intentContent(key)
  const related = INTENT_ORDER.filter((item) => item !== key).map((item) => intentContent(item))
  return `
<article class="seo-prerender">
  <p><a href="/">${escapeHtml(pt.seoPages.backHome)}</a></p>
  <h1>${escapeHtml(page.h1)}</h1>
  <p>${escapeHtml(page.intro)}</p>
  <p><a href="/assinar">${escapeHtml(pt.seoPages.ctaTrial)}</a> · <a href="/assinar?intent=demo">${escapeHtml(pt.seoPages.ctaDemo)}</a></p>
  ${page.sections.map((section) => `<h2>${escapeHtml(section.title)}</h2>\n  <p>${escapeHtml(section.body)}</p>`).join('\n  ')}
  <h2>${escapeHtml(pt.seoPages.relatedTitle)}</h2>
  <ul>
    ${related.map((item) => `<li><a href="${escapeHtml(item.path)}">${escapeHtml(item.h1)}</a></li>`).join('\n    ')}
  </ul>
</article>`
}

export function buildPrerenderHtmlForPath(pathname: string): string {
  const path = (pathname.split('?')[0] || '/').replace(/\/$/, '') || '/'
  if (path === '/') return buildLandingPrerenderHtml()
  const key = INTENT_ORDER.find((item) => intentContent(item).path === path)
  if (key) return buildIntentPrerenderHtml(key)
  return buildLandingPrerenderHtml()
}

export function getIndexableStaticPaths(): string[] {
  return INDEXABLE_SEO_PAGES.map((page) => page.path)
}

/** Marketing routes excluding home — built as flat `{slug}.html` to avoid Netlify directory trailing-slash 301s. */
export function getSeoHtmlRoutes(): string[] {
  return getIndexableStaticPaths().filter((path) => path !== '/')
}

/**
 * Netlify `_redirects` rules.
 *
 * SEO pages are flat `{slug}.html` files. Trailing-slash handling is done by
 * Netlify Pretty URLs (`pretty_urls = true` in netlify.toml) — NOT by custom
 * `/slug/ → /slug 301!` rules. Those loop because Netlify normalizes trailing
 * slashes before matching redirects, so from/to become the same path.
 *
 * Also do not rewrite `/slug → /slug.html 200` while Pretty URLs is on: that
 * creates /slug → .html → /slug forever.
 */
export function buildNetlifyRedirects(): string {
  return [
    '# Generated by fisionotes-seo — do not edit by hand.',
    '# SEO HTML is served via Pretty URLs from `{slug}.html` (see netlify.toml).',
    '# Only the SPA fallback lives here — never trailing-slash-only 301 rules.',
    '/*    /index.html   200',
    '',
  ].join('\n')
}
