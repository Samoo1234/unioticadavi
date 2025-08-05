const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 INICIALIZAÇÃO RÁPIDA E LIMPA');
console.log('===============================');

// Função para matar processos nas portas
const matarProcessosPortas = () => {
  const ports = [3000, 3001, 3002, 3003, 3004, 3005, 5173, 4173];
  
  console.log('🔫 Liberando portas...');
  
  ports.forEach(port => {
    try {
      // Windows - matar processos na porta
      execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /f /pid %a 2>nul`, { stdio: 'pipe' });
      console.log(`✅ Porta ${port} liberada`);
    } catch (error) {
      // Ignora erros se não houver processo na porta
    }
  });
};

// Função para limpar cache rápido
const limparCacheRapido = () => {
  console.log('🧹 Limpeza rápida de cache...');
  
  try {
    // Limpar cache do Vite
    const viteCacheDir = path.join(process.cwd(), 'node_modules', '.vite');
    if (fs.existsSync(viteCacheDir)) {
      execSync(`rmdir /s /q "${viteCacheDir}"`, { stdio: 'pipe' });
      console.log('✅ Cache do Vite limpo');
    }
    
    // Limpar cache do npm (sem forçar)
    execSync('npm cache clean', { stdio: 'pipe' });
    console.log('✅ Cache do npm limpo');
    
  } catch (error) {
    console.log('⚠️ Alguns caches não puderam ser limpos (normal)');
  }
};

// Função para iniciar servidor
const iniciarServidor = () => {
  console.log('🚀 Iniciando servidor...');
  console.log('📝 Para parar: Ctrl+C');
  console.log('📝 Para limpeza completa: npm run clean-start');
  console.log('===============================');
  
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
    
    console.log('✅ Servidor parado e portas liberadas!');
    process.exit(0);
  });
  
  server.on('close', (code) => {
    console.log(`\n🔄 Servidor encerrado com código ${code}`);
    process.exit(code);
  });
};

// Executar sequência
const main = () => {
  try {
    matarProcessosPortas();
    limparCacheRapido();
    iniciarServidor();
  } catch (error) {
    console.error('❌ Erro na execução:', error.message);
    process.exit(1);
  }
};

main(); 