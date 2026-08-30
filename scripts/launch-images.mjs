// iOS launch images for a home-screen install.
//
// Android generates its own splash from the manifest — icon, name and
// background_color — and does a decent job of it. iOS does not. Without an
// apple-touch-startup-image at the exact pixel size of the device, tapping the
// home-screen icon shows a blank white screen until the app has parsed and
// painted. On a mid-range phone that is a second of nothing, which reads as
// the app being broken rather than starting.
//
// So: one PNG per screen size, matching the in-app launch screen, so the
// static image and the animated one that follows it are the same picture.
// The handover is invisible, which is the whole point.
//
// Run with: npm run launch-images

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const OUT = join('public', 'launch')

// Every current iPhone, and the older ones still in wide use here. iOS matches
// these by exact device-width/height and pixel ratio; a size that is missing
// falls back to nothing, so the list has to be explicit rather than clever.
const DEVICES = [
  { w: 1320, h: 2868, dw: 440, dh: 956, r: 3 }, // 16 Pro Max
  { w: 1206, h: 2622, dw: 402, dh: 874, r: 3 }, // 16 Pro
  { w: 1290, h: 2796, dw: 430, dh: 932, r: 3 }, // 14/15 Pro Max, 15/16 Plus
  { w: 1179, h: 2556, dw: 393, dh: 852, r: 3 }, // 14 Pro, 15, 16
  { w: 1170, h: 2532, dw: 390, dh: 844, r: 3 }, // 12, 13, 14
  { w: 1125, h: 2436, dw: 375, dh: 812, r: 3 }, // X, XS, 11 Pro, 12/13 mini
  { w: 1242, h: 2688, dw: 414, dh: 896, r: 3 }, // XS Max, 11 Pro Max
  { w: 828, h: 1792, dw: 414, dh: 896, r: 2 },  // XR, 11
  { w: 1242, h: 2208, dw: 414, dh: 736, r: 3 }, // 8 Plus
  { w: 750, h: 1334, dw: 375, dh: 667, r: 2 },  // 8, SE 2nd/3rd
]

// The same ground the app opens on, so nothing flashes at the handover.
const BG = '#fbfbf9'

/**
 * The launch artwork, as one SVG scaled per device.
 *
 * A still of the in-app splash at the point its animation finishes: mascot,
 * wordmark, tagline. Deliberately not a frame of the animation mid-flight —
 * the static image is on screen while the app loads, and something caught
 * halfway through a bounce looks like a stall.
 */
function artwork(width, height) {
  // Scaled from the 430pt reference the in-app splash was designed at.
  const s = Math.min(width / 430, height / 932) * 1.0
  const cx = width / 2
  const cy = height / 2
  const mascot = 124 * s

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${BG}"/>
  <g transform="translate(${cx - mascot / 2} ${cy - mascot * 1.05}) scale(${mascot / 120})">
    <path d="M43 50V28c0-9 34-9 34 0v22" fill="none" stroke="#2b2b30" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M50 45c-4-6 0-12 6-11 1-6 9-7 12-1 6-2 10 4 8 9 2 3-1 6-4 6z" fill="#6cbf5a" stroke="#3f8a33" stroke-width="1.8" stroke-linejoin="round"/>
    <circle cx="40" cy="41" r="7.5" fill="#e0473e" stroke="#a82f28" stroke-width="1.7"/>
    <path d="M70 47V33l4.5-4.5L79 33v14z" fill="#fdfdfd" stroke="#c9c6d2" stroke-width="1.7" stroke-linejoin="round"/>
    <rect x="82" y="26" width="7.5" height="21" rx="3.7" fill="#e0b271" stroke="#b3853f" stroke-width="1.7" transform="rotate(16 85.7 36)"/>
    <path d="M30 72c-10-2-15-9-16-16" fill="none" stroke="#2b2b30" stroke-width="5" stroke-linecap="round"/>
    <path d="M90 72c10-3 15-11 15-18" fill="none" stroke="#2b2b30" stroke-width="5" stroke-linecap="round"/>
    <path d="M50 98v9" fill="none" stroke="#2b2b30" stroke-width="5" stroke-linecap="round"/>
    <path d="M70 98v9" fill="none" stroke="#2b2b30" stroke-width="5" stroke-linecap="round"/>
    <path d="M43 105h6c4 0 7 2 7 5.5 0 1.5-1 2.5-3 2.5h-10c-3 0-4.5-1.5-4.5-4s2-4 4.5-4z" fill="#fff" stroke="#2b2b30" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M71 105h6c2.5 0 4.5 1.5 4.5 4s-1.5 4-4.5 4H67c-2 0-3-1-3-2.5 0-3.5 3-5.5 7-5.5z" fill="#fff" stroke="#2b2b30" stroke-width="2.2" stroke-linejoin="round"/>
    <circle cx="12" cy="51" r="6" fill="#fff" stroke="#2b2b30" stroke-width="2.2"/>
    <circle cx="106" cy="49" r="6" fill="#fff" stroke="#2b2b30" stroke-width="2.2"/>
    <path d="M29 56h62l-4.5 36a7.5 7.5 0 0 1-7.5 6.5H41A7.5 7.5 0 0 1 33.5 92z" fill="#6d5bd0" stroke="#2b2b30" stroke-width="2.8" stroke-linejoin="round"/>
    <rect x="25" y="47" width="70" height="13" rx="6.5" fill="#6d5bd0" stroke="#2b2b30" stroke-width="2.8"/>
    <rect x="31" y="49.6" width="26" height="2.6" rx="1.3" fill="#fff" opacity="0.5"/>
    <ellipse cx="36" cy="80" rx="6" ry="3.6" fill="#2b2b30" opacity="0.13"/>
    <ellipse cx="84" cy="80" rx="6" ry="3.6" fill="#2b2b30" opacity="0.13"/>
    <path d="M41 73.5q6-7 12 0" fill="none" stroke="#2b2b30" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M67 73.5q6-7 12 0" fill="none" stroke="#2b2b30" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M51 81q9 11 18 0z" fill="#2b2b30"/>
  </g>
  <text x="${cx}" y="${cy + 34 * s}" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="${32 * s}"
        fill="#14141a">CartWise</text>
  <text x="${cx}" y="${cy + 62 * s}" text-anchor="middle"
        font-family="-apple-system, Helvetica, Arial, sans-serif" font-size="${14 * s}"
        fill="#6b6b78">The list that remembers what things cost</text>
</svg>`
}

/** The <link> tags iOS needs, one per size, matched by media query. */
function links(devices) {
  return devices
    .map(
      ({ w, h, dw, dh, r }) =>
        `    <link rel="apple-touch-startup-image" href="%BASE_URL%launch/launch-${w}x${h}.png"\n` +
        `      media="(device-width: ${dw}px) and (device-height: ${dh}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)" />`,
    )
    .join('\n')
}

async function main() {
  await mkdir(OUT, { recursive: true })

  for (const device of DEVICES) {
    const svg = Buffer.from(artwork(device.w, device.h))
    const png = await sharp(svg, { density: 144 }).png({ quality: 90 }).toBuffer()
    await writeFile(join(OUT, `launch-${device.w}x${device.h}.png`), png)
    console.log(`launch-${device.w}x${device.h}.png — ${Math.round(png.length / 1024)} KB`)
  }

  console.log('\nPaste into index.html <head>:\n')
  console.log(links(DEVICES))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
