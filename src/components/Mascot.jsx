// The CartWise character.
//
// Redrawn as SVG from the reference sheet: a shopping basket with a face,
// noodle limbs, mitten gloves and sneakers, carrying a few groceries. Vector
// rather than the supplied bitmap so it stays sharp at every size, recolours
// with the theme, and costs a couple of KB instead of a download.
//
// The body is painted with var(--primary), so the character wears whichever
// accent the user picked rather than fighting it — set the accent to Rose and
// it matches the reference almost exactly. Shading is black and white at low
// opacity over that fill, which keeps one colour token in charge of the whole
// character.
//
// Below about 32px the limbs and shopping become noise, so `simple` drops to
// the basket and an enlarged face. That is the size it appears at on the
// getting-started card, where it has to read as a character in 22 pixels.

const INK = '#2b2b30'

/**
 * Eyes and mouth per state, in body coordinates.
 *
 * `big` scales the features up for the small sizes: the same face that reads
 * as friendly at 96px is a smudge at 22px, so the small one is a different
 * drawing rather than the same drawing shrunk.
 */
function Face({ state, big }) {
  const k = big ? 1.55 : 1
  const eyeR = { rx: 6 * k, ry: 7 * k }
  const lx = big ? 45 : 47
  const rx = big ? 75 : 73
  const cy = big ? 73 : 72
  const dot = 2 * k

  const open = (
    <>
      <ellipse cx={lx} cy={cy} rx={eyeR.rx} ry={eyeR.ry} fill={INK} />
      <ellipse cx={rx} cy={cy} rx={eyeR.rx} ry={eyeR.ry} fill={INK} />
      <circle cx={lx + 2.2} cy={cy - 2.6} r={dot} fill="#fff" />
      <circle cx={rx + 2.2} cy={cy - 2.6} r={dot} fill="#fff" />
    </>
  )

  const arched = (
    <>
      <path
        d={`M${lx - 6} ${cy + 1.5}q6-7 12 0`}
        fill="none"
        stroke={INK}
        strokeWidth={3.2 * k}
        strokeLinecap="round"
      />
      <path
        d={`M${rx - 6} ${cy + 1.5}q6-7 12 0`}
        fill="none"
        stroke={INK}
        strokeWidth={3.2 * k}
        strokeLinecap="round"
      />
    </>
  )

  const grin = <path d={`M${60 - 9 * k} ${cy + 9}q${9 * k} ${11 * k} ${18 * k} 0z`} fill={INK} />
  const smile = <path d={`M${60 - 7 * k} ${cy + 10}q${7 * k} ${9 * k} ${14 * k} 0z`} fill={INK} />

  switch (state) {
    case 'happy':
    case 'success':
      return (
        <>
          {arched}
          {grin}
        </>
      )

    case 'wink':
      return (
        <>
          <ellipse cx={lx} cy={cy} rx={eyeR.rx} ry={eyeR.ry} fill={INK} />
          <circle cx={lx + 2.2} cy={cy - 2.6} r={dot} fill="#fff" />
          <path
            d={`M${rx - 6} ${cy + 1.5}q6-7 12 0`}
            fill="none"
            stroke={INK}
            strokeWidth={3.2 * k}
            strokeLinecap="round"
          />
          {smile}
        </>
      )

    case 'thinking':
      return (
        <>
          {open}
          <path
            d={`M${60 - 6 * k} ${cy + 13}q${6 * k} -${4 * k} ${12 * k} 0`}
            fill="none"
            stroke={INK}
            strokeWidth={3 * k}
            strokeLinecap="round"
          />
        </>
      )

    case 'sad':
      return (
        <>
          {open}
          {/* Brows tipped inward. Without them the face just reads as blank. */}
          <path
            d={`M${lx - 7} ${cy - 10}q6-3 11-1`}
            fill="none"
            stroke={INK}
            strokeWidth={2.6 * k}
            strokeLinecap="round"
          />
          <path
            d={`M${rx + 7} ${cy - 10}q-6-3-11-1`}
            fill="none"
            stroke={INK}
            strokeWidth={2.6 * k}
            strokeLinecap="round"
          />
          <path
            d={`M${60 - 6 * k} ${cy + 15}q${6 * k} -${7 * k} ${12 * k} 0`}
            fill="none"
            stroke={INK}
            strokeWidth={3 * k}
            strokeLinecap="round"
          />
        </>
      )

    default:
      return (
        <>
          {open}
          {smile}
        </>
      )
  }
}

/** The groceries poking out of the top. Hidden when the basket is empty. */
function Shopping() {
  return (
    <g>
      {/* Lettuce, tucked behind the handle */}
      <path
        d="M50 45c-4-6 0-12 6-11 1-6 9-7 12-1 6-2 10 4 8 9 2 3-1 6-4 6z"
        fill="#6cbf5a"
        stroke="#3f8a33"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Apple */}
      <circle cx="40" cy="41" r="7.5" fill="#e0473e" stroke="#a82f28" strokeWidth="1.7" />
      <path d="M40 34v-3.5" stroke="#6b4a2a" strokeWidth="2" strokeLinecap="round" />
      {/* Milk carton */}
      <path
        d="M70 47V33l4.5-4.5L79 33v14z"
        fill="#fdfdfd"
        stroke="#c9c6d2"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <rect x="71.5" y="38" width="6" height="3.6" rx="1.2" fill="var(--primary)" opacity=".55" />
      {/* Baguette */}
      <rect
        x="82"
        y="26"
        width="7.5"
        height="21"
        rx="3.7"
        fill="#e0b271"
        stroke="#b3853f"
        strokeWidth="1.7"
        transform="rotate(16 85.7 36)"
      />
      {/* Can */}
      <rect x="30" y="37" width="8.5" height="10" rx="1.8" fill="#d9534f" stroke="#a13b38" strokeWidth="1.5" />
    </g>
  )
}

const Glove = ({ x, y, flip = false }) => (
  <g>
    <circle cx={x} cy={y} r="6" fill="#fff" stroke={INK} strokeWidth="2.2" />
    {/* The crease is what makes it a mitten. Without it a white circle on a
        pale background is an outline of nothing. */}
    <path
      d={flip ? `M${x + 2.6} ${y - 4}q2.2 2.6 0 5.4` : `M${x - 2.6} ${y - 4}q-2.2 2.6 0 5.4`}
      fill="none"
      stroke={INK}
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </g>
)

/**
 * @param {'idle'|'happy'|'wink'|'thinking'|'walking'|'loading'|'success'|'sad'} state
 */
export default function Mascot({
  state = 'idle',
  size = 96,
  simple = false,
  className = '',
  title = null,
}) {
  const empty = state === 'sad'
  const walking = state === 'walking'
  const cheerful = state === 'happy' || state === 'success' || state === 'wink'

  // Arms. The raised wave is what gives the character its personality, so the
  // cheerful states get it and the flat ones keep both arms down.
  const arms = cheerful
    ? { l: 'M30 72c-10-2-15-9-16-16', lg: [12, 51], r: 'M90 72c10-3 15-11 15-18', rg: [106, 49] }
    : walking
      ? { l: 'M30 74c-8 3-11 9-11 14', lg: [18, 90], r: 'M90 72c8-2 12-7 13-12', rg: [104, 57] }
      : { l: 'M30 74c-9 2-13 8-13 14', lg: [16, 90], r: 'M90 74c9 2 13 8 13 14', rg: [104, 90] }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`mascot mascot--${state} ${className}`}
      role={title ? 'img' : 'presentation'}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      {/* Ground shadow, so the character stands rather than floats. */}
      {!simple && <ellipse cx="60" cy="115" rx="27" ry="3.6" fill={INK} opacity=".16" />}

      {/* Handle first, so its feet disappear behind the rim. A tall arch: the
          reference's handle is most of the character's height, and a short one
          makes it read as a bucket. */}
      <path
        d="M43 50V28c0-9 34-9 34 0v22"
        fill="none"
        stroke={INK}
        strokeWidth={simple ? 7.5 : 6.5}
        strokeLinecap="round"
      />

      {!simple && !empty && <Shopping />}

      {!simple && (
        <>
          {/* Limbs behind the body, so they emerge from underneath it. */}
          <path d={arms.l} fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <path d={arms.r} fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />

          <path
            d={walking ? 'M50 98v7l-5 4' : 'M50 98v9'}
            fill="none"
            stroke={INK}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d={walking ? 'M70 98v9l6 2' : 'M70 98v9'}
            fill="none"
            stroke={INK}
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Sneakers: a rounded wedge, toe forward. */}
          <path
            d={
              walking
                ? 'M36 106h9c3 0 5 2 5 5s-2 4-5 4h-9c-3 0-4-2-4-4.5s1-4.5 4-4.5z'
                : 'M43 105h6c4 0 7 2 7 5.5 0 1.5-1 2.5-3 2.5h-10c-3 0-4.5-1.5-4.5-4s2-4 4.5-4z'
            }
            fill="#fff"
            stroke={INK}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d={
              walking
                ? 'M72 108h10c3 0 4 2 4 4.5s-1 4.5-4 4.5h-10c-3 0-5-2-5-4.5s2-4.5 5-4.5z'
                : 'M71 105h6c2.5 0 4.5 1.5 4.5 4s-1.5 4-4.5 4H67c-2 0-3-1-3-2.5 0-3.5 3-5.5 7-5.5z'
            }
            fill="#fff"
            stroke={INK}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          <Glove x={arms.lg[0]} y={arms.lg[1]} />
          <Glove x={arms.rg[0]} y={arms.rg[1]} flip />
        </>
      )}

      {/* ------------------------------------------------------------ body */}
      <path
        d="M29 56h62l-4.5 36a7.5 7.5 0 0 1-7.5 6.5H41A7.5 7.5 0 0 1 33.5 92z"
        fill="var(--primary)"
        stroke={INK}
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      {/* Moulded grooves — what makes it read as a plastic basket. Dropped at
          small sizes, where they are noise competing with the face. */}
      {!simple && (
        <>
          <g stroke={INK} strokeWidth="1.5" opacity=".2" strokeLinecap="round">
            <path d="M44 62l-1.3 30" />
            <path d="M60 62v30" />
            <path d="M76 62l1.3 30" />
          </g>
          <path d="M35 62h6l-2.5 32h-6z" fill="#fff" opacity=".18" />
          <path d="M85 62h4l-4 32h-4z" fill={INK} opacity=".1" />
        </>
      )}

      {/* Rim, proud of the body so the basket has a lip. */}
      <rect x="25" y="47" width="70" height="13" rx="6.5" fill="var(--primary)" stroke={INK} strokeWidth="2.8" />
      {!simple && <rect x="28.5" y="50" width="63" height="3.5" rx="1.8" fill="#fff" opacity=".24" />}

      {/* ------------------------------------------------------------ face */}
      {/* Blush in black at low opacity, so it deepens whatever accent is set
          rather than being a pink that only works on a pink basket. */}
      <ellipse cx={simple ? 34 : 36} cy={simple ? 82 : 80} rx={simple ? 6.5 : 6} ry={simple ? 4 : 3.6} fill={INK} opacity=".13" />
      <ellipse cx={simple ? 86 : 84} cy={simple ? 82 : 80} rx={simple ? 6.5 : 6} ry={simple ? 4 : 3.6} fill={INK} opacity=".13" />
      <Face state={state} big={simple} />

      {/* --------------------------------------------------- state extras */}
      {!simple && state === 'happy' && (
        <g stroke={INK} strokeWidth="2.4" strokeLinecap="round" opacity=".7">
          <path d="M23 38l-5-4M28 30l-2-6M18 47l-6-1" />
          <path d="M97 38l5-4M92 30l2-6M102 47l6-1" />
        </g>
      )}

      {!simple && state === 'success' && (
        <g>
          <rect x="18" y="30" width="6" height="3.2" rx="1.6" fill="#6cbf5a" transform="rotate(-20 21 31)" />
          <rect x="96" y="34" width="6" height="3.2" rx="1.6" fill="#e0473e" transform="rotate(25 99 35)" />
          <rect x="28" y="18" width="6" height="3.2" rx="1.6" fill="#e0b271" transform="rotate(40 31 19)" />
          <rect x="88" y="20" width="6" height="3.2" rx="1.6" fill="#4a9fd4" transform="rotate(-35 91 21)" />
          <circle cx="13" cy="42" r="2.2" fill="#6cbf5a" />
          <circle cx="108" cy="28" r="2.2" fill="#e0473e" />
        </g>
      )}

      {!simple && state === 'thinking' && (
        <text x="96" y="28" fontSize="24" fontWeight="700" fill={INK} opacity=".8" fontFamily="Inter, sans-serif">
          ?
        </text>
      )}

      {!simple && state === 'walking' && (
        <g stroke={INK} strokeWidth="2.4" strokeLinecap="round" opacity=".3">
          <path d="M99 70h15M101 79h12M103 88h9" />
        </g>
      )}

      {!simple && state === 'loading' && (
        <g fill="var(--primary)" className="mascot__dots">
          <circle cx="50" cy="18" r="3.2" />
          <circle cx="60" cy="18" r="3.2" />
          <circle cx="70" cy="18" r="3.2" />
        </g>
      )}

      {!simple && state === 'sad' && (
        <path
          d="M94 30c3.5 4.5 5.5 6.5 5.5 9.5a5.5 5.5 0 0 1-11 0c0-3 2-5 5.5-9.5z"
          fill="#8fc7e8"
          stroke={INK}
          strokeWidth="1.8"
          opacity=".92"
        />
      )}
    </svg>
  )
}
