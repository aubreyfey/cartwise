// Raster icons for the home screen.
//
// The manifest and the apple-touch-icon were SVG only. Android copes; iOS
// Safari does not — an SVG apple-touch-icon renders as a blank or generic
// tile, which is what anyone adding CartWise to their iPhone home screen was
// getting. The one platform we most want this on was the one it did not work
// on.
//
// Run with: npm run icons

import { mkdir, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const OUT = 'public'
const SOURCE = join(OUT, 'icon.svg')
const MASKABLE = join(OUT, 'icon-maskable.svg')

// 180 is what iOS asks for; 192 and 512 are the manifest sizes Android and
// Chrome want. 512 also feeds the install splash.
const SIZES = [
  { file: 'apple-touch-icon.png', size: 180, src: SOURCE, background: '#ffffff' },
  { file: 'icon-192.png', size: 192, src: SOURCE, background: null },
  { file: 'icon-512.png', size: 512, src: SOURCE, background: null },
  { file: 'icon-maskable-512.png', size: 512, src: MASKABLE, background: null },
]

async function main() {
  await mkdir(OUT, { recursive: true })

  for (const { file, size, src, background } of SIZES) {
    const svg = readFileSync(src)
    let image = sharp(svg, { density: 384 }).resize(size, size, {
      fit: 'contain',
      // iOS composites the touch icon onto its own square and ignores alpha,
      // so a transparent one comes out black. Everything else keeps alpha.
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    })
    if (background) image = image.flatten({ background })

    const buffer = await image.png().toBuffer()
    await writeFile(join(OUT, file), buffer)
    console.log(`${file.padEnd(26)} ${size}x${size}  ${Math.round(buffer.length / 1024)} KB`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
