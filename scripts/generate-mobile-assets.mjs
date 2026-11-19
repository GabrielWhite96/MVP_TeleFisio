import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const logo = 'public/logos/logo_semfundo_sem_nome.png'
const bg = '#07241E'

await mkdir('resources', { recursive: true })

const iconSize = 1024
const logoPad = Math.round(iconSize * 0.18)
const logoSize = iconSize - logoPad * 2
const logoBuf = await sharp(logo)
  .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()

await sharp({
  create: { width: iconSize, height: iconSize, channels: 4, background: bg },
})
  .composite([{ input: logoBuf, gravity: 'centre' }])
  .png()
  .toFile('resources/icon.png')

const splash = 2732
const splashLogo = Math.round(splash * 0.28)
const splashLogoBuf = await sharp(logo)
  .resize(splashLogo, splashLogo, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()

await sharp({
  create: { width: splash, height: splash, channels: 4, background: bg },
})
  .composite([{ input: splashLogoBuf, gravity: 'centre' }])
  .png()
  .toFile('resources/splash.png')

await sharp('resources/splash.png').toFile('resources/splash-dark.png')
await sharp('resources/icon.png').toFile('resources/icon-only.png')

console.log('Generated resources/icon.png, splash.png, splash-dark.png, icon-only.png')
