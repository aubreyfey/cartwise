// Turn the App Store panels into something a phone can download.
//
// The originals are 1290 x 2796 PNGs, about 5.9 MB for the set. Shipping
// those inside a 96 KB app would mean the onboarding weighed sixty times
// what the app does. Resized to phone width and encoded as WebP they come
// out around a tenth of that, and nobody can tell the difference on a screen
// that is 400 points wide.
//
// Run with: npm run tour:images

import { readdir, mkdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const SOURCE = 'marketing'
const OUT = join('public', 'tour')

// Twice the widest phone in CSS pixels, so it stays sharp on a 2x/3x screen
// without paying for the full 1290.
const WIDTH = 860

async function main() {
  await mkdir(OUT, { recursive: true })

  const files = (await readdir(SOURCE))
    .filter((f) => /^appstore-\d+\.png$/.test(f))
    .sort()

  if (files.length === 0) {
    console.error(`No appstore-*.png found in ${SOURCE}/`)
    process.exitCode = 1
    return
  }

  let before = 0
  let after = 0

  for (const file of files) {
    const from = join(SOURCE, file)
    const to = join(OUT, file.replace(/\.png$/, '.webp'))

    before += (await stat(from)).size

    await sharp(from)
      .resize({ width: WIDTH, withoutEnlargement: true })
      // Photographic gradients dominate these panels, so quality matters more
      // than the sharp-text handling that would justify lossless.
      .webp({ quality: 80, effort: 6 })
      .toFile(to)

    const size = (await stat(to)).size
    after += size
    console.log(`${file} -> ${to}  ${Math.round(size / 1024)} KB`)
  }

  const pct = Math.round((1 - after / before) * 100)
  console.log(
    `\n${files.length} panels: ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB (${pct}% smaller)`,
  )

  // The tall capture the welcome screen scrolls through its phone.
  const scrollSrc = join('marketing', 'shots', 'scroll-src.png')
  try {
    await stat(scrollSrc)
    const scrollOut = join(OUT, 'scroll.webp')
    await sharp(scrollSrc)
      .resize({ width: 560, withoutEnlargement: true })
      .webp({ quality: 78, effort: 6 })
      .toFile(scrollOut)
    console.log(`scroll-src.png -> ${scrollOut}  ${Math.round((await stat(scrollOut)).size / 1024)} KB`)
  } catch {
    console.log('No marketing/shots/scroll-src.png; skipping the welcome scroll image.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
