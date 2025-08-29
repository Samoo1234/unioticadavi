import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://dmsaqxuoruinwpnonpky.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2FxeHVvcnVpbndwbm9ucGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQyNTYsImV4cCI6MjA2ODUxMDI1Nn0.qgUE3Lpn5-dgphbW6k59Pu4M-xkwpI6KtAYR7m5FkdU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCredorField() {
  try {
    console.log('Adicionando campo credor na tabela despesas_fixas...');
    
    // Executar o SQL para adicionar o campo credor
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.despesas_fixas ADD COLUMN IF NOT EXISTS credor VARCHAR(255);'
    });
    
    if (error) {
      console.error('Erro ao adicionar campo credor:', error);
      
      // Tentar método alternativo usando uma função SQL
      console.log('Tentando método alternativo...');
      const { data: data2, error: error2 } = await supabase
        .from('despesas_fixas')
        .select('*')
        .limit(1);
      
      if (error2) {
        console.error('Erro ao verificar tabela:', error2);
      } else {
        console.log('Tabela despesas_fixas existe e está acessível');
        console.log('Estrutura atual:', Object.keys(data2[0] || {}));
      }
    } else {
      console.log('Campo credor adicionado com sucesso!');
      console.log('Resultado:', data);
    }
    
  } catch (err) {
    console.error('Erro geral:', err);
  }
}

// Executar a função
addCredorField();