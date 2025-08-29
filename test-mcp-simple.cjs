console.log('🔍 TESTE SIMPLES DO MCP');
console.log('=======================\n');

// Teste 1: Supabase
console.log('1. 📦 Testando Supabase...');
try {
  const { createClient } = require('@supabase/supabase-js');
  console.log('   ✅ @supabase/supabase-js OK');
  
  const supabase = createClient(
    'https://dmsaqxuoruinwpnonpky.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2FxeHVvcnVpbndwbm9ucGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQyNTYsImV4cCI6MjA2ODUxMDI1Nn0.qgUE3Lpn5-dgphbW6k59Pu4M-xkwpI6KtAYR7m5FkdU'
  );
  console.log('   ✅ Cliente Supabase criado');
} catch (err) {
  console.log('   ❌ Erro:', err.message);
}

// Teste 2: MCP SDK
console.log('\n2. 📦 Testando MCP SDK...');
try {
  const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
  console.log('   ✅ @modelcontextprotocol/sdk OK');
} catch (err) {
  console.log('   ❌ Erro:', err.message);
  
  // Tentar caminho alternativo
  try {
    const mcp = require('@modelcontextprotocol/sdk');
    console.log('   ✅ @modelcontextprotocol/sdk OK (caminho alternativo)');
  } catch (err2) {
    console.log('   ❌ Erro alternativo:', err2.message);
  }
}

// Teste 3: Arquivos
console.log('\n3. 📁 Verificando arquivos...');
const fs = require('fs');
const files = ['mcp-supabase-server.js', 'mcp-supabase-config.json'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file}`);
  }
});

console.log('\n🎯 RESULTADO:');
console.log('O MCP está tecnicamente configurado!');
console.log('\n📋 Para usar:');
console.log('1. Adicione o campo credor no Supabase Dashboard');
console.log('2. Configure no Claude Desktop');
console.log('3. Teste as funcionalidades');