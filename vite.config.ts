import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/services': resolve(__dirname, './src/services'),
      '@/types': resolve(__dirname, './src/types'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/contexts': resolve(__dirname, './src/contexts'),
      '@/themes': resolve(__dirname, './src/themes')
    }
  },
  server: {
    port: 3002,
    open: true,
    host: true, // Permite acesso externo
    hmr: {
      overlay: true, // Mostra erros na tela
      port: 3002 // Mesma porta do servidor
    },
    watch: {
      usePolling: true, // Melhor para alguns sistemas de arquivo
      interval: 100 // Intervalo de polling
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})