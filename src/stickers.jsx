// Original vector stickers, drawn in the glossy style people expect from a
// phone: a gradient body, a soft specular highlight, and a die-cut white
// border.
//
// The gradients live in one hidden <svg> mounted once (StickerDefs), so a
// list of forty rows references them rather than repeating the definitions
// forty times. No third-party product art or emoji font is involved anywhere.

// Names and matching live in stickerCatalog.js, which is plain JavaScript so
// the tests can import it. Re-exported so existing imports keep working.
export { STICKER_IDS, stickerFor } from './stickerCatalog.js'

const GRADIENTS = [
  ['sYellow', '#ffe06a', '#e8a91f'],
  ['sRed', '#f0645a', '#bf2f28'],
  ['sGreen', '#7fd063', '#3f8a33'],
  ['sGreenDeep', '#5cb04a', '#2f6b28'],
  ['sBrown', '#c98a52', '#8b5527'],
  ['sTan', '#f0c68a', '#c9924c'],
  ['sCream', '#fffaf0', '#e6dcc8'],
  ['sBlue', '#7fb4ec', '#3b6fb5'],
  ['sSky', '#bfe6f7', '#7cc0e0'],
  ['sSteel', '#dde4ea', '#a8b6c4'],
  ['sOrange', '#ffb45e', '#e07a1c'],
  ['sPurple', '#b49ce0', '#7b5ea7'],
  ['sPink', '#f6b8cf', '#d97fa6'],
  ['sPaper', '#ffffff', '#d9dce4'],
]

/**
 * Mounted once near the root. Gradients referenced by url(#id) resolve
 * document-wide, so every sticker on the page can share these.
 */
export function StickerDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <defs>
        {GRADIENTS.map(([id, from, to]) => (
          <linearGradient key={id} id={id} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        ))}
        {/* The shine that sells the plastic look. */}
        <radialGradient id="sShine" cx="0.35" cy="0.28" r="0.55">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )
}

const g = (name) => `url(#${name})`
const shine = 'url(#sShine)'

const P = {
  banana: (
    <>
      <path fill={g('sYellow')} d="M12 10c-2 12 4 26 20 28 8 1 8-4 3-5C22 31 18 21 19 11z" />
      <path fill="#d99a1c" d="M32 38c8 1 8-4 3-5-4-1-7-2-9-4 3 5 6 8 6 9z" />
      <path fill="#8a6a2f" d="M11 8h4v5h-4z" />
      <path fill={shine} d="M14 12c-1 9 3 19 13 23-8-6-11-15-10-23z" />
    </>
  ),
  apple: (
    <>
      <path fill={g('sRed')} d="M24 12c7-4 16 0 16 11 0 12-8 19-12 19-2 0-3-1-4-1s-2 1-4 1c-4 0-12-7-12-19 0-11 9-15 16-11z" />
      <path fill="#4a8f3c" d="M24 13c0-5 3-8 8-8 0 5-3 8-8 8z" />
      <path fill="#6b4a2a" d="M23 6h2v7h-2z" />
      <ellipse cx="17" cy="20" rx="5" ry="7" fill={shine} />
    </>
  ),
  broccoli: (
    <>
      <circle cx="18" cy="16" r="8" fill={g('sGreen')} />
      <circle cx="30" cy="15" r="8" fill={g('sGreen')} />
      <circle cx="24" cy="23" r="8" fill={g('sGreenDeep')} />
      <path fill="#a8cf8c" d="M21 26h6l2 16h-10z" />
      <ellipse cx="16" cy="13" rx="4" ry="3" fill={shine} />
    </>
  ),
  carrot: (
    <>
      <path fill={g('sOrange')} d="M20 18l8-4 12 26-4 4z" />
      <path fill={g('sGreen')} d="M18 16l-8-6 10 2-2-8 6 8 4-6-2 10z" />
      <path fill={shine} d="m23 19 4-2 7 15z" />
    </>
  ),
  tomato: (
    <>
      <circle cx="24" cy="27" r="14" fill={g('sRed')} />
      <path fill="#4a8f3c" d="M24 14l-7-5 6 2-1-6 4 5 4-5-1 6 6-2z" />
      <ellipse cx="18" cy="22" rx="5" ry="4" fill={shine} />
    </>
  ),
  leaf: (
    <>
      <path fill={g('sGreenDeep')} d="M38 8C18 8 8 18 8 32c0 5 3 8 3 8S16 22 38 8z" />
      <path fill={g('sGreen')} d="M38 8c0 20-12 30-24 30 0 0 4 4 10 4 12 0 16-14 14-34z" />
      <path fill={shine} d="M32 12c-8 8-14 16-17 22 6-6 12-14 17-22z" />
    </>
  ),
  bread: (
    <>
      <path fill={g('sTan')} d="M8 22c0-8 7-12 16-12s16 4 16 12v14a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" />
      <path fill="#c1874a" d="M14 16c2-2 5-3 10-3s8 1 10 3c-3-1-6-2-10-2s-7 1-10 2z" />
      <ellipse cx="17" cy="24" rx="6" ry="4" fill={shine} />
    </>
  ),
  baguette: (
    <>
      <path fill={g('sTan')} d="M9 36 33 9c3-3 8 1 5 5L14 41c-3 3-8-1-5-5z" />
      <path stroke="#a8692f" strokeWidth="2.5" strokeLinecap="round" d="m18 25 4 3m2-8 4 3m2-8 4 3" />
      <path fill={shine} d="M13 33 32 12l2 2-19 21z" />
    </>
  ),
  drumstick: (
    <>
      <path fill={g('sBrown')} d="M30 8c7 0 11 5 11 10 0 8-8 10-12 14l-7-7c4-4 6-12 8-17z" />
      <path fill={g('sCream')} d="m21 25 7 7-9 9-3-1-1 4-4 1-1-4-4-1 1-3z" />
      <ellipse cx="31" cy="15" rx="4" ry="5" fill={shine} />
    </>
  ),
  fish: (
    <>
      <path fill={g('sBlue')} d="M8 24c6-8 14-11 22-11s14 5 14 11-6 11-14 11-16-3-22-11z" />
      <path fill="#3f89aa" d="M8 24 2 15v18z" />
      <circle cx="35" cy="21" r="2.5" fill="#1f4b5e" />
      <ellipse cx="24" cy="19" rx="8" ry="3" fill={shine} />
    </>
  ),
  milk: (
    <>
      <path fill={g('sPaper')} d="M17 18h14v20a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" />
      <path fill="#dbe6f0" d="M19 8h10v10H19z" />
      <path fill={g('sBlue')} d="M17 26h14v7H17z" />
      <path fill={shine} d="M19 19h4v22h-2a2 2 0 0 1-2-2z" />
    </>
  ),
  egg: (
    <>
      <ellipse cx="24" cy="27" rx="13" ry="16" fill={g('sCream')} />
      <ellipse cx="24" cy="30" rx="7" ry="6" fill={g('sYellow')} />
      <ellipse cx="18" cy="20" rx="4" ry="6" fill={shine} />
    </>
  ),
  cheese: (
    <>
      <path fill={g('sYellow')} d="M6 32 40 12v20a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" />
      <circle cx="16" cy="29" r="3" fill="#d19c22" />
      <circle cx="28" cy="26" r="2.5" fill="#d19c22" />
      <path fill={shine} d="M8 31 38 14v3L9 33z" />
    </>
  ),
  yogurt: (
    <>
      <path fill={g('sPaper')} d="M13 18h22l-3 20a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z" />
      <path fill={g('sPink')} d="M11 13h26v6H11z" />
      <path fill={shine} d="M16 19h4l2 22h-3z" />
    </>
  ),
  ice: (
    <>
      <path stroke={g('sSky')} strokeWidth="5" strokeLinecap="round" d="M24 5v38M8 15l32 18M40 15 8 33" />
      <circle cx="24" cy="24" r="5" fill="#dff2fb" />
      <circle cx="22" cy="22" r="2" fill={shine} />
    </>
  ),
  can: (
    <>
      <ellipse cx="24" cy="13" rx="12" ry="4" fill={g('sSteel')} />
      <path fill={g('sSteel')} d="M12 13h24v22c0 3-5 5-12 5s-12-2-12-5z" />
      <path fill={g('sRed')} d="M12 20h24v10H12z" />
      <path fill={shine} d="M15 15h4v24h-4z" />
    </>
  ),
  jar: (
    <>
      <path fill={g('sBrown')} d="M13 20h22v16a5 5 0 0 1-5 5H18a5 5 0 0 1-5-5z" />
      <path fill="#6d4425" d="M12 11h24v8H12z" />
      <path fill={shine} d="M16 21h4v19h-2a2 2 0 0 1-2-2z" />
    </>
  ),
  pasta: (
    <>
      <path fill={g('sBlue')} d="M14 8h20v34H14z" />
      <path fill={g('sTan')} d="M18 14h12v22H18z" />
      <path fill="#c9a768" d="M20 14h2v22h-2zm5 0h2v22h-2zm5 0h-2v22h2z" />
      <path fill={shine} d="M15 9h3v32h-3z" />
    </>
  ),
  oil: (
    <>
      <path fill={g('sGreen')} d="M17 20h14v18a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" />
      <path fill="#6f9c34" d="M21 8h6v12h-6z" />
      <path fill="#4d6f22" d="M20 5h8v4h-8z" />
      <path fill={shine} d="M19 22h3v19h-1a2 2 0 0 1-2-2z" />
    </>
  ),
  chips: (
    <>
      <path fill={g('sOrange')} d="M12 10h24l-2 32H14z" />
      <path fill={g('sYellow')} d="M17 18h14v12H17z" />
      <path fill="#c96a24" d="M12 10h24l-1 5H13z" />
      <path fill={shine} d="M15 12h4l-1 28h-3z" />
    </>
  ),
  cookie: (
    <>
      <circle cx="24" cy="26" r="15" fill={g('sTan')} />
      <circle cx="19" cy="21" r="2.5" fill="#5e3a1c" />
      <circle cx="29" cy="24" r="2.5" fill="#5e3a1c" />
      <circle cx="22" cy="32" r="2.5" fill="#5e3a1c" />
      <ellipse cx="18" cy="18" rx="5" ry="4" fill={shine} />
    </>
  ),
  bottle: (
    <>
      <path fill={g('sSky')} d="M17 19h14v19a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" />
      <path fill="#cdeaf7" d="M20 7h8v12h-8z" />
      <path fill={g('sBlue')} d="M19 6h10v3H19z" />
      <path fill={shine} d="M20 20h3v21h-1a2 2 0 0 1-2-2z" />
    </>
  ),
  cup: (
    <>
      <path fill={g('sRed')} d="M12 14h22l-3 25a4 4 0 0 1-4 3h-8a4 4 0 0 1-4-3z" />
      <path fill={g('sCream')} d="M14 20h18l-.5 5h-17z" />
      <path fill={shine} d="M16 15h3l2 26h-2z" />
    </>
  ),
  paper: (
    <>
      <path fill={g('sPaper')} d="M13 10h22v32H13z" />
      <ellipse cx="24" cy="10" rx="11" ry="4" fill="#e6e8ee" />
      <path fill="#c9cad2" d="M21 14h6v24h-6z" />
      <path fill={shine} d="M15 12h4v29h-4z" />
    </>
  ),
  spray: (
    <>
      <path fill={g('sGreen')} d="M16 18h16v20a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4z" />
      <path fill="#4f8f60" d="M20 10h7v8h-7z" />
      <path fill="#3c6b4a" d="M27 8h8v4h-8z" />
      <path fill={shine} d="M18 20h3v21h-1a2 2 0 0 1-2-2z" />
    </>
  ),
  basket: (
    <>
      <path fill={g('sPurple')} d="M6 18h36l-4 20a4 4 0 0 1-4 3H14a4 4 0 0 1-4-3z" />
      <path fill="#6d5aa0" d="M15 8h3v11h-3zm15 0h3v11h-3z" />
      <path fill={shine} d="M10 20h4l3 19h-3z" />
    </>
  ),
}

export default function Sticker({ id, size = 28, tilt = 0, className = '' }) {
  const art = P[id] ?? P.basket
  return (
    <svg
      className={`sticker ${className}`}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
    >
      {art}
    </svg>
  )
}
