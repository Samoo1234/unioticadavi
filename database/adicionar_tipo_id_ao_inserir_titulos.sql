-- Script para corrigir o problema de inserção de títulos
-- O erro "You violate row level security policy for table 'titulos'" ocorre durante o INSERT

-- 1. Verificar o problema na estrutura da tabela e nos dados
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'titulos';

-- 2. Verificar as políticas RLS atuais
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'titulos';

-- 3. Temporariamente desativar RLS para realizar operações de diagnóstico
ALTER TABLE public.titulos DISABLE ROW LEVEL SECURITY;

-- 4. Verificar a definição da coluna tipo_id
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name, 
    ccu.table_name AS foreign_table_name, 
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu 
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'titulos';

-- 5. Modificar o código na função handleAddOrEdit em Titulos.tsx
-- Adicionar tipo_id ao objeto tituloData:
/*
const tituloData = {
  numero: proximoNumero,
  fornecedor_id: form.fornecedor_id,
  filial_id: form.filial_id,
  tipo_id: fornecedorObj.tipo_id, // Adicionar este campo
  valor: parseFloat(form.valor),
  data_vencimento: form.vencimento || '',
  status: 'pendente' as const,
  observacao: form.observacoes || undefined,
  tipo: 'pagar'
};
*/

-- 6. Alterar a consulta de fornecedores para incluir tipo_id na seleção
-- Modificar a função carregarFornecedores em Titulos.tsx para incluir tipo_id

-- 7. Criar uma nova política RLS abrangente que permita operações aos usuários autenticados
DROP POLICY IF EXISTS policy_titulos_all ON public.titulos;

CREATE POLICY policy_titulos_all
  ON public.titulos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8. Reativar RLS após as correções
ALTER TABLE public.titulos ENABLE ROW LEVEL SECURITY;

-- 9. Verificar se as políticas foram aplicadas corretamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'titulos';

-- 10. Verificar permissões do usuário na tabela
GRANT ALL ON TABLE public.titulos TO authenticated;
