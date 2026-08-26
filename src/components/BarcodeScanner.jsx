import { useEffect, useRef, useState } from 'react'

// Two decoders, in order of preference:
//
// 1. The native BarcodeDetector. Free, instant, no download — but it only
//    ships on Android and ChromeOS. Not Windows desktop, not iOS Safari.
// 2. ZXing, imported dynamically the first time someone opens the scanner.
//    It's a few hundred KB, so it stays out of the main bundle entirely and
//    costs nothing to anyone who never scans. Vite splits it into its own
//    chunk under /assets/, which the service worker then caches like any
//    other hashed asset — so it works offline after the first scan.
//
// So the requirement is just a camera; the decoder is an implementation
// detail the user never has to think about.
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf']

const hasNative = () => typeof window !== 'undefined' && 'BarcodeDetector' in window

export const scannerSupported = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

export default function BarcodeScanner({ onScan, onCancel }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const stoppedRef = useRef(false)
  const [error, setError] = useState(null)
  const [loadingDecoder, setLoadingDecoder] = useState(false)

  useEffect(() => {
    if (!scannerSupported()) {
      setError('unsupported')
      return
    }

    let detector
    let frame
    let zxingControls

    async function start() {
      if (hasNative()) {
        try {
          detector = new window.BarcodeDetector({ formats: FORMATS })
        } catch {
          // Some builds ship the constructor but support fewer formats.
          detector = new window.BarcodeDetector()
        }
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (stoppedRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        if (detector) {
          scan()
        } else {
          await startZxing(stream)
        }
      } catch (e) {
        setError(e?.name === 'NotAllowedError' ? 'denied' : 'camera')
      }
    }

    async function startZxing(stream) {
      setLoadingDecoder(true)
      let BrowserMultiFormatReader
      try {
        ;({ BrowserMultiFormatReader } = await import('@zxing/browser'))
      } catch {
        setError('decoder')
        return
      } finally {
        setLoadingDecoder(false)
      }
      if (stoppedRef.current) return

      const reader = new BrowserMultiFormatReader()
      zxingControls = await reader.decodeFromStream(
        stream,
        videoRef.current,
        (result) => {
          if (!result || stoppedRef.current) return
          stop()
          onScan(String(result.getText()).trim())
        },
      )
      // A result can arrive between the await above and this line.
      if (stoppedRef.current) zxingControls.stop()
    }

    async function scan() {
      if (stoppedRef.current) return
      const video = videoRef.current
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          const found = await detector.detect(video)
          if (found.length > 0 && found[0].rawValue) {
            stop()
            onScan(String(found[0].rawValue).trim())
            return
          }
        } catch {
          // A single failed frame is normal; keep looking.
        }
      }
      frame = requestAnimationFrame(scan)
    }

    function stop() {
      stoppedRef.current = true
      if (frame) cancelAnimationFrame(frame)
      try {
        zxingControls?.stop()
      } catch {
        // Already stopped.
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    start()
    return stop
  }, [onScan])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="sheet" role="presentation" onMouseDown={onCancel}>
      <div
        className="scanner"
        role="dialog"
        aria-modal="true"
        aria-label="Scan a barcode"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {error ? (
          <div className="scanner__message">
            <h2 className="scanner__title">
              {error === 'unsupported' ? 'No camera here' : 'Camera unavailable'}
            </h2>
            <p>
              {error === 'unsupported' &&
                "This device has no camera available to the browser. You can still add items by typing."}
              {error === 'denied' &&
                'Camera access was blocked. Allow it in your browser settings, then try again.'}
              {error === 'camera' &&
                "Couldn't start the camera. Something else may be using it."}
              {error === 'decoder' &&
                "Couldn't load the barcode reader. If you're offline, open the scanner once while connected and it'll work offline after that."}
            </p>
          </div>
        ) : (
          <>
            <video className="scanner__video" ref={videoRef} muted playsInline />
            <div className="scanner__reticle" aria-hidden="true" />
            <p className="scanner__hint">
              {loadingDecoder ? 'Starting the reader…' : 'Point at a barcode'}
            </p>
          </>
        )}

        <button className="btn btn--ghost scanner__close" type="button" onClick={onCancel}>
          Close
        </button>
      </div>
    </div>
  )
}
