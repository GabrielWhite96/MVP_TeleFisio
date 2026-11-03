import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { BRAND_NAME } from '@/shared/config/brand'
import { getCanonicalUrl, getOgImageUrl, OG_IMAGE_ALT } from '@/shared/config/site'
import { trackPageView } from '@/shared/lib/analytics'
import { buildJsonLdForSeo, getSeoForPath } from '@/shared/seo/pages'

const JSON_LD_ID = 'fisionotes-jsonld'

function upsertMeta(selector: string, attributes: Record<string, string>, content?: string) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null
  if (!element) {
    const tag = selector.startsWith('link') || attributes.rel ? 'link' : 'meta'
    element = document.createElement(tag) as HTMLMetaElement | HTMLLinkElement
    document.head.appendChild(element)
  }
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value)
  }
  if (content !== undefined && 'content' in element) {
    element.setAttribute('content', content)
  }
}

function upsertJsonLd(data: unknown | null) {
  const current = document.getElementById(JSON_LD_ID)
  if (!data) {
    current?.remove()
    return
  }
  const script = current instanceof HTMLScriptElement ? current : document.createElement('script')
  script.id = JSON_LD_ID
  script.type = 'application/ld+json'
  script.text = JSON.stringify(data)
  if (!current) document.head.appendChild(script)
}

export function DocumentMeta() {
  const location = useLocation()

  useEffect(() => {
    const seo = getSeoForPath(location.pathname)
    const canonical = getCanonicalUrl(seo.canonicalPath)
    const robots = seo.index
      ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
      : 'noindex, nofollow'
    const image = getOgImageUrl()
    const pageUrl = `${window.location.origin}${location.pathname}${location.search}`

    document.title = seo.title
    upsertMeta('meta[name="description"]', { name: 'description' }, seo.description)
    if (seo.keywords) {
      upsertMeta('meta[name="keywords"]', { name: 'keywords' }, seo.keywords)
    }
    upsertMeta('meta[name="robots"]', { name: 'robots' }, robots)
    upsertMeta('meta[name="googlebot"]', { name: 'googlebot' }, robots)
    upsertMeta('link[rel="canonical"]', { rel: 'canonical', href: canonical })
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, seo.title)
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, seo.description)
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonical)
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, image)
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, OG_IMAGE_ALT)
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, BRAND_NAME)
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, seo.title)
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, seo.description)
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, image)
    upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, OG_IMAGE_ALT)
    upsertJsonLd(buildJsonLdForSeo(seo))

    trackPageView({
      path: `${location.pathname}${location.search}`,
      title: seo.title,
      location: pageUrl,
    })
  }, [location.pathname, location.search])

  return null
}
