import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  css: {
    // Prevent Vite's PostCSS config search from climbing into the parent
    // folder and picking up an unrelated postcss.config.js there.
    postcss: { plugins: [] },
  },
})
