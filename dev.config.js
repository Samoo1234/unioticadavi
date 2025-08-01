// Configurações de desenvolvimento
module.exports = {
  // Configurações do servidor
  server: {
    port: 3002,
    host: true,
    hmr: {
      overlay: true,
      port: 3002
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  
  // Configurações de cache
  cache: {
    enabled: true,
    dir: 'node_modules/.vite',
    maxAge: 86400000 // 24 horas
  },
  
  // Configurações de performance
  performance: {
    optimizeDeps: true,
    forceReload: false,
    prebundle: true
  },
  
  // Configurações de debug
  debug: {
    enabled: true,
    logLevel: 'info',
    showErrors: true
  }
}; 