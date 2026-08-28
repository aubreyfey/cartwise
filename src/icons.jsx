// Interface icons.
//
// These replace the emoji that used to sit in headings and buttons. Emoji are
// drawn by the operating system, so the same character is a different picture
// on iOS, Android and Windows — and Apple's set cannot be shipped with a web
// app, since it is a proprietary font. Drawing them keeps every device
// identical, follows the text colour, and costs about a kilobyte.
//
// Food and aisles use the sticker set instead; these are only for the parts
// of the app that are not products.

const PATHS = {
  check: (
    <path d="m4.5 12.5 5 5 10-11" />
  ),
  trash: (
    <>
      <path d="M4.5 7h15" />
      <path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
      <path d="M6.5 7l1 12a2 2 0 0 0 2 1.8h5a2 2 0 0 0 2-1.8l1-12" />
    </>
  ),
  cart: (
    <>
      <path d="M4 7h16l-1.6 9a2 2 0 0 1-2 1.7H7.6a2 2 0 0 1-2-1.7z" />
      <path d="M8.5 7V5.4a3.5 3.5 0 0 1 7 0V7" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5 13.6 8 18 9.6 13.6 11.2 12 15.7 10.4 11.2 6 9.6 10.4 8z" />
      <path d="M18 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3.2 3.2 0 0 1 0 6" />
      <path d="M17.5 14.6a5.5 5.5 0 0 1 3 4.9" />
    </>
  ),
  save: (
    <>
      <path d="M5 4.5h11L19.5 8v11a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V6A1.5 1.5 0 0 1 6 4.5z" />
      <path d="M8 4.5v5h7v-5" />
      <path d="M8 20.5v-5.5h8v5.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
      <path d="M8 14h3" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16.5v-4M12.5 16.5v-8M17 16.5v-5.5" />
    </>
  ),
  vault: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 12h17" />
      <path d="M10 8.2h4M10 16h4" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="M15.4 15.4 20 20" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8.5h3.2l1.6-2.4h7.4l1.6 2.4h3.2v10a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
      <circle cx="12" cy="13.5" r="3.6" />
    </>
  ),
  barcode: (
    <>
      <path d="M4 6v12M7.5 6v12M11 6v9M14.5 6v12M18 6v9M20.5 6v12" />
    </>
  ),
  basket: (
    <>
      <path d="M3.5 9.5h17l-1.7 9a2 2 0 0 1-2 1.6H7.2a2 2 0 0 1-2-1.6z" />
      <path d="M8 9.5 10.5 4M16 9.5 13.5 4" />
    </>
  ),
  fridge: (
    <>
      <rect x="6" y="2.8" width="12" height="18.4" rx="2.4" />
      <path d="M6 10h12" />
      <path d="M9 6.5v2M9 13v2.5" />
    </>
  ),
  snowflake: (
    <>
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
      <path d="M12 6.6 9.6 4.4M12 6.6l2.4-2.2M12 17.4l-2.4 2.2M12 17.4l2.4 2.2" />
    </>
  ),
  shelf: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="2.2" />
      <path d="M3.5 12h17" />
      <path d="M7.5 7.5h3M13.5 15.5h3" />
    </>
  ),
  box: (
    <>
      <path d="M3.5 8.2 12 4l8.5 4.2v7.6L12 20l-8.5-4.2z" />
      <path d="M3.5 8.2 12 12.4l8.5-4.2M12 12.4V20" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.8A1.8 1.8 0 0 1 5.8 3H19v15.5H5.8A1.8 1.8 0 0 0 4 20.3z" />
      <path d="M4 18.5A1.8 1.8 0 0 1 5.8 16.7H19V21H5.8A1.8 1.8 0 0 1 4 19.2z" />
      <path d="M8 7.5h7M8 11h5" />
    </>
  ),
  bell: (
    <>
      <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.2 2 5.8H4.5c.5-.6 2-1.8 2-5.8z" />
      <path d="M10 19a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  house: (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.8V19a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V9.8" />
      <path d="M10 20.5v-5.5h4v5.5" />
    </>
  ),
  cap: (
    <>
      <path d="M2.5 9.5 12 5.2l9.5 4.3L12 13.8z" />
      <path d="M6.5 11.6v4.6c0 1.6 2.5 2.9 5.5 2.9s5.5-1.3 5.5-2.9v-4.6" />
      <path d="M21.5 9.5v5" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12.5" rx="2.2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.8h18" />
    </>
  ),
  // Sliders rather than a cog: a circle ringed with spokes reads as a sun at
  // nav-bar size, which is the wrong idea entirely.
  gear: (
    <>
      <path d="M4 7.5h5M13 7.5h7M4 16.5h7M15 16.5h5" />
      <circle cx="11" cy="7.5" r="2.3" />
      <circle cx="13" cy="16.5" r="2.3" />
    </>
  ),
  wave: (
    <>
      <path d="M9 11V5.8a1.4 1.4 0 0 1 2.8 0V11" />
      <path d="M11.8 10.4V4.8a1.4 1.4 0 0 1 2.8 0v5.6" />
      <path d="M14.6 10.8V6.6a1.4 1.4 0 0 1 2.8 0v6.6c0 4-2.6 7.3-6 7.3s-5.2-2.4-5.2-5.2V12a1.4 1.4 0 0 1 2.8 0v1.6" />
    </>
  ),
}

export const ICON_NAMES = Object.keys(PATHS)

export default function Icon({ name, size = 18, className = '', strokeWidth = 1.7 }) {
  const art = PATHS[name]
  if (!art) return null
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {art}
    </svg>
  )
}
