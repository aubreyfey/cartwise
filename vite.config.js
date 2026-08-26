import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves a project site from /<repo>/, so the build needs to
  // know its own prefix. Cloudflare, Netlify and Vercel all serve from the
  // root, where this stays '/'. Set BASE_PATH=/cartwise/ for Pages.
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
})
