import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  build: { assetsInlineLimit: (path) => path.endsWith('.glb') ? true : undefined },
  plugins: [react()],
  server: { port: 5174, open: true },
})
