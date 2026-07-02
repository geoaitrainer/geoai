import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(root, 'public')

const icon = readFileSync(join(pub, 'icon.svg'))
const maskable = readFileSync(join(pub, 'icon-maskable.svg'))

// PWA / Play Store require raster PNGs (Android launcher ignores SVG).
const targets = [
  { src: icon, size: 192, out: 'icon-192.png' },
  { src: icon, size: 512, out: 'icon-512.png' },
  { src: maskable, size: 512, out: 'icon-maskable-512.png' },
  { src: icon, size: 180, out: 'apple-touch-icon.png' }, // iOS home screen
]

for (const t of targets) {
  await sharp(t.src, { density: 300 })
    .resize(t.size, t.size)
    .png()
    .toFile(join(pub, t.out))
  console.log(`✓ ${t.out} (${t.size}x${t.size})`)
}
console.log('done')
