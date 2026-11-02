/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { writeFileSync } from 'node:fs'
import {
  buildLandingPrerenderHtml,
  buildRobotsTxt,
  buildSeoHeadHtml,
  buildSitemapXml,
} from './src/shared/seo/pages'
import { DEFAULT_SITE_URL } from './src/shared/config/site'

function seoPrerenderPlugin(): Plugin {
  return {
    name: 'fisionotes-seo',
    transformIndexHtml(html) {
      return html
        .replace('<!--seo-head-->', `<!--seo-head-->\n${buildSeoHeadHtml()}`)
        .replace('<div id="root"></div>', `<div id="root">${buildLandingPrerenderHtml()}</div>`)
    },
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist')
      try {
        const siteUrl = process.env.VITE_SITE_URL?.replace(/\/$/, '') || DEFAULT_SITE_URL
        writeFileSync(path.join(dist, 'robots.txt'), buildRobotsTxt(siteUrl))
        writeFileSync(path.join(dist, 'sitemap.xml'), buildSitemapXml(siteUrl))
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
