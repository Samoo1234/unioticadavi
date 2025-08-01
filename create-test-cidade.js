import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://dmsaqxuoruinwpnonpky.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2FxeHVvcnVpbndwbm9ucGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQyNTYsImV4cCI6MjA2ODUxMDI1Nn0.qgUE3Lpn5-dgphbW6k59Pu4M-xkwpI6KtAYR7m5FkdU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestCidade() {
  try {
    console.log('🏙️ Criando cidade de teste...');
    
    // Inserir cidade de teste
    const { data: cidade, error: cidadeError } = await supabase
      .from('cidades')
      .insert({
        nome: 'São Paulo',
        estado: 'SP',
        active: true
      })
      .select()
      .single();
    
    if (cidadeError) {
      console.log('❌ Erro ao criar cidade:', cidadeError);
      return;
    }
    
    console.log('✅ Cidade criada:', cidade);
    
    // Criar algumas datas disponíveis
    const hoje = new Date();
    const datasParaCriar = [];
    
    for (let i = 1; i <= 7; i++) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + i);
      
      datasParaCriar.push({
        cidade_id: cidade.id,
        data: data.toISOString().split('T')[0],
        status: 'Disponível'
      });
    }
    
    console.log('📅 Criando datas disponíveis...');
    const { data: datas, error: datasError } = await supabase
      .from('datas_disponiveis')
      .insert(datasParaCriar)
      .select();
    
    if (datasError) {
      console.log('❌ Erro ao criar datas:', datasError);
      return;
    }
    
    console.log('✅ Datas criadas:', datas?.length, 'datas');
    
    // Verificar se tudo está funcionando
    console.log('\n🔍 Verificando dados criados...');
    
    const { data: cidadesAtivas, error: verificacaoError } = await supabase
      .from('cidades')
      .select('*')
      .eq('active', true);
    
    if (verificacaoError) {
      console.log('❌ Erro na verificação:', verificacaoError);
    } else {
      console.log('✅ Cidades ativas encontradas:', cidadesAtivas?.length);
      console.log('📋 Cidades:', cidadesAtivas);
    }
    
    console.log('\n🎉 Configuração concluída! O formulário de agendamento deve aparecer agora.');
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

createTestCidade();