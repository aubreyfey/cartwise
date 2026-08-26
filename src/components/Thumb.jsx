import Sticker, { stickerFor } from '../stickers.jsx'

/**
 * An item's picture: the photo you cut out if there is one, otherwise the
 * drawn sticker for its name or aisle. Same die-cut treatment either way, so
 * a list of both doesn't look half-finished.
 */
export default function Thumb({ name, category, photo, size = 30, tilt = 0 }) {
  if (photo) {
    return (
      <img
        className="sticker-photo"
        src={photo}
        alt=""
        width={size}
        height={size}
        style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
      />
    )
  }
  return <Sticker id={stickerFor(name, category)} size={size} tilt={tilt} />
}
