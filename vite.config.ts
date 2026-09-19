import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import path from 'node:path'

// The admin console is a second website (admin/index.html -> src/admin) served under /admin/.
// Vite's built-in fallback would answer /admin/requests/12 with the investigator site's index.html.
function adminConsoleRoutes(): Plugin {
  return {
    name: 'admin-console-routes',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [pathname, query = ''] = (req.url ?? '').split('?')
        if (pathname === '/admin') {
          res.statusCode = 302
          res.setHeader('Location', '/admin/')
          res.end()
          return
        }
        if (pathname.startsWith('/admin/') && !path.extname(pathname)) {
          req.url = '/admin/index.html' + (query ? `?${query}` : '')
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), adminConsoleRoutes()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        admin: path.resolve(import.meta.dirname, 'admin/index.html'),
      },
    },
  },
  server: {
    // The API runs as a separate process (see /server); proxying keeps browser requests same-origin
    // so the session cookie needs no CORS setup.
    // xfwd forwards the browser's original host so the API can tell same-site requests apart.
    proxy: { '/api': { target: `http://127.0.0.1:${process.env.API_PORT ?? 3001}`, xfwd: true } },
  },
  css: {
    // Prevent Vite's PostCSS config search from climbing into the parent
    // folder and picking up an unrelated postcss.config.js there.
    postcss: { plugins: [] },
  },
})
