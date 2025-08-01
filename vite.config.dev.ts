import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Configuração otimizada para desenvolvimento
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
    host: true,
    hmr: {
      overlay: true,
      port: 3002
    },
    watch: {
      usePolling: true,
      interval: 100
    },
    // Configurações adicionais para estabilidade
    cors: true,
    strictPort: true,
    force: true
  },
  // Otimizações para desenvolvimento
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      '@supabase/supabase-js'
    ],
    exclude: ['@supabase/supabase-js']
  },
  // Configurações de build para desenvolvimento
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false, // Desabilita minificação em dev
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  // Configurações de cache
  cacheDir: 'node_modules/.vite',
  clearScreen: false,
  logLevel: 'info'
}) 