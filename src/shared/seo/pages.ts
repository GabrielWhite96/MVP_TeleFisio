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
}

export const HOME_SEO: SeoPage = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  path: '/',
  canonicalPath: '/',
  index: true,
  keywords: SEO_KEYWORDS.join(', '),
}

const PRIVATE_SEO: SeoPage = {
  title: BRAND_NAME,
  description: SEO_DESCRIPTION,
  path: '/',
  canonicalPath: '/',
  index: false,
}

export function getSeoForPath(pathname: string): SeoPage {
  const path = (pathname.split('?')[0] || '/').replace(/\/$/, '') || '/'
  if (path === '/') return HOME_SEO
  return {
    ...PRIVATE_SEO,
    path,
    canonicalPath: path === '/assinar' ? '/' : path,
    title: path === '/assinar' ? `Assinar o ${BRAND_NAME}` : BRAND_NAME,
    description:
      path === '/assinar'
        ? `Assine o ${BRAND_NAME}, sistema de organização para fisioterapeutas, por ${SAAS_PLAN.amountLabel}/${SAAS_PLAN.interval}. Agenda, prontuário, financeiro e portal do paciente.`
        : SEO_DESCRIPTION,
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
        applicationSubCategory: 'Sistema de organização para fisioterapeutas',
        operatingSystem: 'Web',
        inLanguage: 'pt-BR',
        description: SEO_DESCRIPTION,
        featureList: [
          pt.landing.featureAgendaTitle,
          pt.landing.featureChartTitle,
          pt.landing.featurePlanTitle,
          pt.landing.featureBillingTitle,
          pt.landing.featurePortalTitle,
        ],
        offers: {
          '@type': 'Offer',
          name: SAAS_PLAN.name,
          price: '29.90',
          priceCurrency: SAAS_PLAN.currency,
          url: `${url}/assinar`,
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

export function buildRobotsTxt(siteUrl = getSiteUrl()): string {
  return [
    'User-agent: *',
    'Allow: /',
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
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    `    <loc>${siteUrl}/</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    '    <changefreq>weekly</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>',
    '</urlset>',
    '',
  ].join('\n')
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function buildSeoHeadHtml(): string {
  const url = getCanonicalUrl('/')
  const image = getOgImageUrl()
  const jsonLd = JSON.stringify(buildSoftwareJsonLd())
  return [
    `<title>${escapeHtml(HOME_SEO.title)}</title>`,
    `<meta name="description" content="${escapeHtml(HOME_SEO.description)}" />`,
    `<meta name="keywords" content="${escapeHtml(HOME_SEO.keywords ?? '')}" />`,
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />',
    '<meta name="googlebot" content="index, follow" />',
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<link rel="alternate" hreflang="pt-BR" href="${escapeHtml(url)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${escapeHtml(url)}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${escapeHtml(BRAND_NAME)}" />`,
    `<meta property="og:locale" content="${SITE_LOCALE}" />`,
    `<meta property="og:title" content="${escapeHtml(HOME_SEO.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(HOME_SEO.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:image:width" content="${String(OG_IMAGE_WIDTH)}" />`,
    `<meta property="og:image:height" content="${String(OG_IMAGE_HEIGHT)}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(HOME_SEO.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(HOME_SEO.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<script type="application/ld+json" id="fisionotes-jsonld">${jsonLd}</script>`,
  ]
    .map((line) => `    ${line}`)
    .join('\n')
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
  <h2>${escapeHtml(pt.landing.featuresTitle)}</h2>
  <ul>
    ${features.map(([title, body]) => `<li><strong>${escapeHtml(title)}</strong> — ${escapeHtml(body)}</li>`).join('\n    ')}
  </ul>
  <h2>${escapeHtml(pt.landing.pricingTitle)}</h2>
  <p>${escapeHtml(pt.landing.pricingSubtitle)} ${escapeHtml(SAAS_PLAN.amountLabel)}${escapeHtml(pt.landing.pricingAmountSuffix)}.</p>
  <h2>${escapeHtml(pt.landing.faqTitle)}</h2>
  ${faqs.map(([q, a]) => `<h3>${escapeHtml(q)}</h3>\n  <p>${escapeHtml(a)}</p>`).join('\n  ')}
</article>`
}
