import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://dmsaqxuoruinwpnonpky.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2FxeHVvcnVpbndwbm9ucGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQyNTYsImV4cCI6MjA2ODUxMDI1Nn0.qgUE3Lpn5-dgphbW6k59Pu4M-xkwpI6KtAYR7m5FkdU';

const supabase = createClient(supabaseUrl, supabaseKey);

class SupabaseManager {
  async addCredorField() {
    try {
      console.log('🔍 Verificando se o campo credor já existe...');
      
      // Verificar estrutura atual da tabela
      const { data: tableInfo, error: infoError } = await supabase
        .from('despesas_fixas')
        .select('*')
        .limit(1);
      
      if (infoError) {
        console.error('❌ Erro ao verificar tabela:', infoError);
        return false;
      }
      
      // Verificar se o campo credor já existe
      if (tableInfo && tableInfo.length > 0) {
        const columns = Object.keys(tableInfo[0]);
        if (columns.includes('credor')) {
          console.log('✅ Campo credor já existe na tabela despesas_fixas');
          return true;
        }
      }
      
      console.log('📝 Adicionando campo credor na tabela despesas_fixas...');
      
      // Tentar adicionar o campo usando SQL direto
      // Como não temos acesso direto ao SQL, vamos usar uma abordagem alternativa
      console.log('⚠️  Não é possível adicionar campos via API do Supabase.');
      console.log('📋 Para adicionar o campo credor, execute o seguinte SQL no Supabase Dashboard:');
      console.log('');
      console.log('ALTER TABLE public.despesas_fixas ADD COLUMN IF NOT EXISTS credor VARCHAR(255);');
      console.log('');
      console.log('🔗 Acesse: https://supabase.com/dashboard/project/dmsaqxuoruinwpnonpky/sql');
      
      return false;
      
    } catch (error) {
      console.error('❌ Erro geral:', error);
      return false;
    }
  }
  
  async listTables() {
    try {
      console.log('📋 Listando tabelas disponíveis...');
      
      // Como não podemos acessar information_schema diretamente,
      // vamos tentar algumas tabelas conhecidas
      const knownTables = [
        'despesas_fixas',
        'despesas_diversas', 
        'categorias',
        'filiais',
        'fornecedores',
        'titulos',
        'clientes',
        'medicos',
        'agendamentos',
        'usuarios'
      ];
      
      console.log('🔍 Verificando tabelas conhecidas:');
      
      for (const table of knownTables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
            
          if (!error) {
            const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
            console.log(`✅ ${table}: ${columns.length} colunas`);
            if (table === 'despesas_fixas') {
              console.log(`   Colunas: ${columns.join(', ')}`);
            }
          } else {
            console.log(`❌ ${table}: não acessível`);
          }
        } catch (err) {
          console.log(`❌ ${table}: erro`);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao listar tabelas:', error);
    }
  }
  
  async testConnection() {
    try {
      console.log('🔗 Testando conexão com Supabase...');
      
      const { data, error } = await supabase
        .from('despesas_fixas')
        .select('count')
        .limit(1);
        
      if (error) {
        console.error('❌ Erro na conexão:', error);
        return false;
      }
      
      console.log('✅ Conexão com Supabase estabelecida com sucesso!');
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error);
      return false;
    }
  }
  
  async showInstructions() {
    console.log('\n🚀 CONFIGURAÇÃO MCP SUPABASE');
    console.log('================================');
    console.log('');
    console.log('Para usar o MCP do Supabase, siga estes passos:');
    console.log('');
    console.log('1. 📝 Adicione o campo credor manualmente no Supabase Dashboard:');
    console.log('   - Acesse: https://supabase.com/dashboard/project/dmsaqxuoruinwpnonpky/sql');
    console.log('   - Execute: ALTER TABLE public.despesas_fixas ADD COLUMN IF NOT EXISTS credor VARCHAR(255);');
    console.log('');
    console.log('2. 🔧 Configure o MCP no seu cliente (Claude Desktop, etc.):');
    console.log('   - Adicione a configuração do arquivo mcp-supabase-config.json');
    console.log('   - Reinicie o cliente MCP');
    console.log('');
    console.log('3. ✅ Teste as funcionalidades:');
    console.log('   - execute_sql: Executar queries SQL');
    console.log('   - list_tables: Listar tabelas');
    console.log('   - describe_table: Descrever estrutura de tabela');
    console.log('   - add_credor_field: Adicionar campo credor');
    console.log('');
  }
}

async function main() {
  const manager = new SupabaseManager();
  
  console.log('🎯 Iniciando configuração do MCP Supabase...');
  console.log('');
  
  // Testar conexão
  const connected = await manager.testConnection();
  if (!connected) {
    console.log('❌ Falha na conexão. Verifique as credenciais.');
    return;
  }
  
  // Listar tabelas
  await manager.listTables();
  console.log('');
  
  // Tentar adicionar campo credor
  await manager.addCredorField();
  console.log('');
  
  // Mostrar instruções
  await manager.showInstructions();
}

// Executar
main().catch(console.error);