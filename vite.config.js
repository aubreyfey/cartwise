import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { execSync } from 'node:child_process'

// Stamped into the bundle so a running app can say which commit it is. When
// someone reports a feature missing, the first question is which build they
// are looking at, and this answers it without guessing.
const stamp = (() => {
  // CI provides the SHA, so the build does not have to shell out at all.
  const fromEnv = process.env.GITHUB_SHA || process.env.VITE_BUILD_STAMP
  if (fromEnv) return fromEnv.slice(0, 7)
  try {
    // Bounded: a slow or wedged git must not hang the whole build, which is
    // exactly what it did once.
    return execSync('git rev-parse --short HEAD', { timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'dev'
  }
})()

export default defineConfig({
  // GitHub Pages serves a project site from /<repo>/, so the build needs to
  // know its own prefix. Cloudflare, Netlify and Vercel all serve from the
  // root, where this stays '/'. Set BASE_PATH=/cartwise/ for Pages.
  base: process.env.BASE_PATH || '/',
  define: { __BUILD_STAMP__: JSON.stringify(stamp) },
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
})
