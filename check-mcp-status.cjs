const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configurações do Supabase
const supabaseUrl = 'https://dmsaqxuoruinwpnonpky.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2FxeHVvcnVpbndwbm9ucGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQyNTYsImV4cCI6MjA2ODUxMDI1Nn0.qgUE3Lpn5-dgphbW6k59Pu4M-xkwpI6KtAYR7m5FkdU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMCPStatus() {
  console.log('🔍 DIAGNÓSTICO RÁPIDO DO MCP SUPABASE');
  console.log('=====================================\n');
  
  let allGood = true;
  
  // 1. Testar conexão
  console.log('1. 🔗 Testando conexão...');
  try {
    const { data, error } = await supabase.from('filiais').select('count').limit(1);
    if (error) {
      console.log('   ❌ Erro:', error.message);
      allGood = false;
    } else {
      console.log('   ✅ Conexão OK');
    }
  } catch (err) {
    console.log('   ❌ Erro:', err.message);
    allGood = false;
  }
  
  // 2. Verificar arquivos
  console.log('\n2. 📁 Verificando arquivos MCP...');
  const files = [
    'mcp-supabase-server.js',
    'mcp-supabase-config.json',
    'setup-mcp-supabase.js'
  ];
  
  for (const file of files) {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} não encontrado`);
      allGood = false;
    }
  }
  
  // 3. Verificar dependências
  console.log('\n3. 📦 Verificando dependências...');
  try {
    require('@modelcontextprotocol/sdk');
    console.log('   ✅ @modelcontextprotocol/sdk');
  } catch (err) {
    console.log('   ❌ @modelcontextprotocol/sdk não encontrado');
    allGood = false;
  }
  
  try {
    require('@supabase/supabase-js');
    console.log('   ✅ @supabase/supabase-js');
  } catch (err) {
    console.log('   ❌ @supabase/supabase-js não encontrado');
    allGood = false;
  }
  
  // 4. Testar tabela despesas_fixas
  console.log('\n4. 🔍 Testando tabela despesas_fixas...');
  try {
    const { data, error } = await supabase
      .from('despesas_fixas')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('   ❌ Erro ao acessar tabela:', error.message);
    } else {
      console.log('   ✅ Tabela acessível');
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`   📋 Colunas: ${columns.join(', ')}`);
        
        if (columns.includes('credor')) {
          console.log('   ✅ Campo credor existe!');
        } else {
          console.log('   ⚠️  Campo credor não existe');
        }
      } else {
        console.log('   ℹ️  Tabela vazia - não é possível verificar colunas');
      }
    }
  } catch (err) {
    console.log('   ❌ Erro:', err.message);
  }
  
  // Resumo
  console.log('\n📋 RESUMO');
  console.log('==========');
  
  if (allGood) {
    console.log('🎉 MCP está configurado corretamente!');
    console.log('');
    console.log('✅ Próximos passos:');
    console.log('1. Adicione o campo credor no Supabase (se necessário):');
    console.log('   ALTER TABLE public.despesas_fixas ADD COLUMN IF NOT EXISTS credor VARCHAR(255);');
    console.log('');
    console.log('2. Configure no Claude Desktop:');
    console.log('   - Copie o conteúdo de mcp-supabase-config.json');
    console.log('   - Cole no arquivo de configuração do Claude');
    console.log('   - Reinicie o Claude Desktop');
    console.log('');
    console.log('3. Teste no Claude:');
    console.log('   - "Liste as tabelas"');
    console.log('   - "Execute SELECT * FROM filiais LIMIT 3"');
  } else {
    console.log('❌ Há problemas na configuração do MCP');
    console.log('🔧 Corrija os erros acima e execute novamente');
  }
}

checkMCPStatus().catch(console.error);