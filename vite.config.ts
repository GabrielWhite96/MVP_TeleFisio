/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { rmSync, readFileSync, writeFileSync } from 'node:fs'
import {
  buildNetlifyRedirects,
  buildPrerenderHtmlForPath,
  buildRobotsTxt,
  buildSeoHeadHtml,
  buildSitemapXml,
  getSeoHtmlRoutes,
} from './src/shared/seo/pages'
import { DEFAULT_SITE_URL } from './src/shared/config/site'

const SEO_HEAD_MARKER = '<!--seo-head-->'

function replaceRootContent(html: string, body: string): string {
  return html.replace(/<div id="root">[\s\S]*?<\/div>/, `<div id="root">${body}</div>`)
}

function replaceSeoHead(html: string, head: string): string {
  if (!html.includes(SEO_HEAD_MARKER)) return html
  const withoutOld = html.replace(
    new RegExp(`${SEO_HEAD_MARKER}[\\s\\S]*?(?=\\s*<link rel="icon")`),
    `${SEO_HEAD_MARKER}\n`
  )
  return withoutOld.replace(SEO_HEAD_MARKER, `${SEO_HEAD_MARKER}\n${head}`)
}

function seoPrerenderPlugin(): Plugin {
  return {
    name: 'fisionotes-seo',
    transformIndexHtml(html) {
      return replaceRootContent(
        html.replace(SEO_HEAD_MARKER, `${SEO_HEAD_MARKER}\n${buildSeoHeadHtml('/')}`),
        buildPrerenderHtmlForPath('/')
      )
    },
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist')
      try {
        const siteUrl = process.env.VITE_SITE_URL?.replace(/\/$/, '') || DEFAULT_SITE_URL
        writeFileSync(path.join(dist, 'robots.txt'), buildRobotsTxt(siteUrl))
        writeFileSync(path.join(dist, 'sitemap.xml'), buildSitemapXml(siteUrl))
        writeFileSync(path.join(dist, '_redirects'), buildNetlifyRedirects())

        const indexHtml = readFileSync(path.join(dist, 'index.html'), 'utf8')
        for (const routePath of getSeoHtmlRoutes()) {
          const slug = routePath.replace(/^\//, '')
          // Remove legacy directory output from older builds (causes Netlify 301 to trailing slash).
          rmSync(path.join(dist, slug), { recursive: true, force: true })
          const pageHtml = replaceRootContent(
            replaceSeoHead(indexHtml, buildSeoHeadHtml(routePath)),
            buildPrerenderHtmlForPath(routePath)
          )
          // Flat HTML so /slug is served with HTTP 200 (no directory → no trailing-slash redirect).
          writeFileSync(path.join(dist, `${slug}.html`), pageHtml)
        }
      } catch {
        // dist may be absent when Vite is only transforming HTML in tests
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPrerenderPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**'],
  },
})
