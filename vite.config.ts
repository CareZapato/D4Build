import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Proxy para evitar CORS con OpenAI API
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ [Vite Proxy Error]:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📡 [Vite Proxy] Enviando solicitud:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('✅ [Vite Proxy] Respuesta recibida:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    allowedHosts: ['d4build.onrender.com']
  }
})
