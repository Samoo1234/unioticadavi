import { createClient } from '@supabase/supabase-js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Configurações do Supabase
const supabaseUrl = 'https://dmsaqxuoruinwpnonpky.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2FxeHVvcnVpbndwbm9ucGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQyNTYsImV4cCI6MjA2ODUxMDI1Nn0.qgUE3Lpn5-dgphbW6k59Pu4M-xkwpI6KtAYR7m5FkdU';

const supabase = createClient(supabaseUrl, supabaseKey);

class MCPTester {
  async testConnection() {
    console.log('🔗 Testando conexão com Supabase...');
    
    try {
      const { data, error } = await supabase
        .from('despesas_fixas')
        .select('count')
        .limit(1);
        
      if (error) {
        console.error('❌ Erro na conexão:', error.message);
        return false;
      }
      
      console.log('✅ Conexão com Supabase estabelecida!');
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error.message);
      return false;
    }
  }
  
  async testMCPServer() {
    console.log('🧪 Testando servidor MCP...');
    
    try {
      // Criar servidor MCP
      const server = new Server(
        {
          name: 'supabase-test',
          version: '1.0.0',
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );
      
      // Adicionar ferramenta de teste
      server.setRequestHandler('tools/list', async () => {
        return {
          tools: [
            {
              name: 'test_connection',
              description: 'Testa conexão com Supabase',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
          ],
        };
      });
      
      server.setRequestHandler('tools/call', async (request) => {
        if (request.params.name === 'test_connection') {
          const connected = await this.testConnection();
          return {
            content: [
              {
                type: 'text',
                text: connected ? 'Conexão OK!' : 'Falha na conexão',
              },
            ],
          };
        }
        
        throw new Error(`Ferramenta desconhecida: ${request.params.name}`);
      });
      
      console.log('✅ Servidor MCP criado com sucesso!');
      return server;
      
    } catch (error) {
      console.error('❌ Erro ao criar servidor MCP:', error.message);
      return null;
    }
  }
  
  async testSupabaseQueries() {
    console.log('📊 Testando queries do Supabase...');
    
    const tests = [
      {
        name: 'Listar filiais',
        query: () => supabase.from('filiais').select('*').limit(5)
      },
      {
        name: 'Verificar despesas_fixas',
        query: () => supabase.from('despesas_fixas').select('*').limit(1)
      },
      {
        name: 'Listar fornecedores',
        query: () => supabase.from('fornecedores').select('*').limit(3)
      }
    ];
    
    for (const test of tests) {
      try {
        console.log(`  🔍 ${test.name}...`);
        const { data, error } = await test.query();
        
        if (error) {
          console.log(`    ❌ Erro: ${error.message}`);
        } else {
          console.log(`    ✅ OK - ${data?.length || 0} registros`);
        }
      } catch (err) {
        console.log(`    ❌ Exceção: ${err.message}`);
      }
    }
  }
  
  async checkCredorField() {
    console.log('🔍 Verificando campo credor...');
    
    try {
      // Tentar inserir um registro de teste com credor
      const testData = {
        filial_id: 1,
        categoria_id: 1,
        nome: 'Teste MCP',
        credor: 'Fornecedor Teste',
        valor: 100.00,
        periodicidade: 'mensal',
        data_vencimento: new Date().toISOString().split('T')[0]
      };
      
      const { data, error } = await supabase
        .from('despesas_fixas')
        .insert(testData)
        .select();
        
      if (error) {
        if (error.message.includes('credor')) {
          console.log('❌ Campo credor não existe na tabela');
          console.log('📝 Execute no Supabase Dashboard:');
          console.log('   ALTER TABLE public.despesas_fixas ADD COLUMN IF NOT EXISTS credor VARCHAR(255);');
        } else {
          console.log(`❌ Erro: ${error.message}`);
        }
      } else {
        console.log('✅ Campo credor existe e funciona!');
        
        // Remover o registro de teste
        if (data && data[0]) {
          await supabase
            .from('despesas_fixas')
            .delete()
            .eq('id', data[0].id);
          console.log('🧹 Registro de teste removido');
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao verificar campo credor:', error.message);
    }
  }
  
  async runAllTests() {
    console.log('🚀 INICIANDO TESTES DO MCP SUPABASE');
    console.log('=====================================\n');
    
    // Teste 1: Conexão
    const connected = await this.testConnection();
    console.log('');
    
    if (!connected) {
      console.log('❌ Falha na conexão. Parando testes.');
      return;
    }
    
    // Teste 2: Queries básicas
    await this.testSupabaseQueries();
    console.log('');
    
    // Teste 3: Campo credor
    await this.checkCredorField();
    console.log('');
    
    // Teste 4: Servidor MCP
    const server = await this.testMCPServer();
    console.log('');
    
    // Resumo
    console.log('📋 RESUMO DOS TESTES');
    console.log('====================');
    console.log(`✅ Conexão Supabase: ${connected ? 'OK' : 'FALHA'}`);
    console.log(`✅ Servidor MCP: ${server ? 'OK' : 'FALHA'}`);
    console.log('');
    
    if (connected && server) {
      console.log('🎉 MCP está funcionando!');
      console.log('');
      console.log('📝 Para usar no Claude Desktop:');
      console.log('1. Adicione a configuração do mcp-supabase-config.json');
      console.log('2. Reinicie o Claude Desktop');
      console.log('3. Execute o campo credor no Supabase se necessário');
    } else {
      console.log('❌ MCP não está funcionando completamente');
      console.log('🔧 Verifique os erros acima e corrija-os');
    }
  }
}

// Executar testes
const tester = new MCPTester();
tester.runAllTests().catch(console.error);