const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 LIMPEZA AUTOMÁTICA E INICIALIZAÇÃO DO SERVIDOR');
console.log('================================================');

// Função para matar processos nas portas
const matarProcessosPortas = () => {
  const ports = [3000, 3001, 3002, 3003, 3004, 3005, 5173, 4173];
  
  console.log('🔫 Matando processos nas portas...');
  
  ports.forEach(port => {
    try {
      // Windows
      execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
      execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /f /pid %a`, { stdio: 'pipe' });
      console.log(`✅ Porta ${port} liberada`);
    } catch (error) {
      // Ignora erros se não houver processo na porta
    }
  });
};

// Função para limpar cache
const limparCache = () => {
  console.log('🗑️ Limpando cache...');
  
  try {
    // Limpar cache do npm
    execSync('npm cache clean --force', { stdio: 'inherit' });
    console.log('✅ Cache do npm limpo');
    
    // Remover node_modules se existir
    if (fs.existsSync('node_modules')) {
      console.log('🗑️ Removendo node_modules...');
      execSync('rmdir /s /q node_modules', { stdio: 'inherit' });
      console.log('✅ node_modules removido');
    }
    
    // Remover package-lock.json se existir
    if (fs.existsSync('package-lock.json')) {
      fs.unlinkSync('package-lock.json');
      console.log('✅ package-lock.json removido');
    }
    
    // Limpar cache do Vite
    const viteCacheDir = path.join(process.cwd(), 'node_modules', '.vite');
    if (fs.existsSync(viteCacheDir)) {
      execSync(`rmdir /s /q "${viteCacheDir}"`, { stdio: 'inherit' });
      console.log('✅ Cache do Vite limpo');
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error.message);
  }
};

// Função para reinstalar dependências
const reinstalarDependencias = () => {
  console.log('📦 Reinstalando dependências...');
  
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependências reinstaladas');
  } catch (error) {
    console.error('❌ Erro ao reinstalar dependências:', error.message);
    process.exit(1);
  }
};

// Função para iniciar servidor
const iniciarServidor = () => {
  console.log('🚀 Iniciando servidor...');
  console.log('📝 Para parar o servidor: Ctrl+C');
  console.log('📝 Para limpeza automática na próxima vez: npm run clean-start');
  console.log('================================================');
  
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  // Capturar Ctrl+C para limpeza automática
  process.on('SIGINT', () => {
    console.log('\n🛑 Parando servidor...');
    server.kill('SIGINT');
    
    console.log('🧹 Limpeza automática ao sair...');
    matarProcessosPortas();
    
    console.log('✅ Servidor parado e cache limpo!');
    process.exit(0);
  });
  
  server.on('close', (code) => {
    console.log(`\n🔄 Servidor encerrado com código ${code}`);
    process.exit(code);
  });
};

// Executar sequência completa
const main = () => {
  try {
    matarProcessosPortas();
    limparCache();
    reinstalarDependencias();
    iniciarServidor();
  } catch (error) {
    console.error('❌ Erro na execução:', error.message);
    process.exit(1);
  }
};

main(); 