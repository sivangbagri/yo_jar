import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ["bikini-kit-andale-burn.trycloudflare.com"],
    proxy: {
      // Any request to /0x-api/* gets forwarded to api.0x.org
      // Headers are added server-side — no CORS preflight from browser
      '/0x-api': {
        target: 'https://api.0x.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/0x-api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Inject headers server-side — never exposed to browser
            proxyReq.setHeader('0x-api-key', '635651ea-2f3d-4adf-a638-98df91b8a81e')
            proxyReq.setHeader('0x-version', 'v2')
          })
        },
      },
  }
}
})
