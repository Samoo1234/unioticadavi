#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando servidor de desenvolvimento otimizado...');

// Verificar se o arquivo de configuração existe
const configPath = path.join(__dirname, 'vite.config.ts');
if (!fs.existsSync(configPath)) {
  console.error('❌ Arquivo vite.config.ts não encontrado!');
  process.exit(1);
}

// Função para limpar cache se necessário
function cleanCache() {
  const cacheDir = path.join(__dirname, 'node_modules', '.vite');
  if (fs.existsSync(cacheDir)) {
    console.log('🧹 Limpando cache do Vite...');
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
}

// Verificar se deve limpar cache
const shouldCleanCache = process.argv.includes('--clean');
if (shouldCleanCache) {
  cleanCache();
}

// Configurar variáveis de ambiente para desenvolvimento
process.env.NODE_ENV = 'development';
process.env.VITE_DEV_MODE = 'true';

// Iniciar o servidor Vite
const viteProcess = spawn('npx', ['vite', '--host', '--force'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    VITE_DEV_SERVER: 'true'
  }
});

// Gerenciar eventos do processo
viteProcess.on('error', (error) => {
  console.error('❌ Erro ao iniciar servidor:', error);
  process.exit(1);
});

viteProcess.on('close', (code) => {
  console.log(`\n🔄 Servidor encerrado com código: ${code}`);
  if (code !== 0) {
    console.log('💡 Dica: Tente executar "npm run restart" para limpar cache e reiniciar');
  }
});

// Capturar sinais de interrupção
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  viteProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando servidor...');
  viteProcess.kill('SIGTERM');
});

console.log('✅ Servidor iniciado! Acesse: http://localhost:3002');
console.log('💡 Pressione Ctrl+C para encerrar'); 