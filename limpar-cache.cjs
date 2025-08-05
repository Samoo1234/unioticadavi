const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Limpando cache e reiniciando servidor...');

try {
  // Matar processos na porta 3000, 3001, 3002, 3003, 3004, 3005
  const ports = [3000, 3001, 3002, 3003, 3004, 3005];
  
  ports.forEach(port => {
    try {
      execSync(`npx kill-port ${port}`, { stdio: 'ignore' });
      console.log(`✅ Porta ${port} liberada`);
    } catch (error) {
      // Ignora erros se não houver processo na porta
    }
  });

  // Limpar cache do npm
  console.log('🗑️ Limpando cache do npm...');
  execSync('npm cache clean --force', { stdio: 'inherit' });

  // Remover node_modules
  console.log('🗑️ Removendo node_modules...');
  if (fs.existsSync('node_modules')) {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  }

  // Remover package-lock.json
  console.log('🗑️ Removendo package-lock.json...');
  if (fs.existsSync('package-lock.json')) {
    fs.unlinkSync('package-lock.json');
  }

  // Limpar cache do Vite
  console.log('🗑️ Limpando cache do Vite...');
  const viteCacheDir = path.join(process.cwd(), 'node_modules', '.vite');
  if (fs.existsSync(viteCacheDir)) {
    execSync(`rm -rf "${viteCacheDir}"`, { stdio: 'inherit' });
  }

  // Reinstalar dependências
  console.log('📦 Reinstalando dependências...');
  execSync('npm install', { stdio: 'inherit' });

  // Iniciar servidor
  console.log('🚀 Iniciando servidor...');
  execSync('npm run dev', { stdio: 'inherit' });

} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
} 