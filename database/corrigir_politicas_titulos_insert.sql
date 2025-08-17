-- Script para corrigir políticas RLS da tabela titulos para permitir INSERT
-- Baseado no erro: "You violate row level security policy for table 'titulos'"

-- 1. Primeiro, verificamos as políticas RLS existentes na tabela
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

-- 2. Desativamos temporariamente o RLS para a tabela titulos
ALTER TABLE public.titulos DISABLE ROW LEVEL SECURITY;

-- 3. Removemos as políticas existentes que possam estar causando conflitos
DROP POLICY IF EXISTS policy_titulos_select ON public.titulos;
DROP POLICY IF EXISTS policy_titulos_insert ON public.titulos;
DROP POLICY IF EXISTS policy_titulos_update ON public.titulos;
DROP POLICY IF EXISTS policy_titulos_delete ON public.titulos;
DROP POLICY IF EXISTS policy_titulos_all ON public.titulos;

-- 4. Criamos novas políticas adequadas para cada operação
-- Política para SELECT - permite que usuários autenticados vejam todos os registros
CREATE POLICY policy_titulos_select
  ON public.titulos
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para INSERT - permite que usuários autenticados adicionem registros
CREATE POLICY policy_titulos_insert
  ON public.titulos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para UPDATE - permite que usuários autenticados atualizem registros
CREATE POLICY policy_titulos_update
  ON public.titulos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para DELETE - permite que usuários autenticados removam registros
CREATE POLICY policy_titulos_delete
  ON public.titulos
  FOR DELETE
  TO authenticated
  USING (true);

-- 5. Reativamos o RLS para a tabela titulos
ALTER TABLE public.titulos ENABLE ROW LEVEL SECURITY;

-- 6. Verificamos as permissões no nível da tabela
-- Garantimos que o role 'authenticated' tenha as permissões necessárias
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.titulos TO authenticated;

-- 7. Verificamos se as políticas foram criadas corretamente
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

-- 8. Verificamos a estrutura da tabela para confirmar que não há problemas
-- com os tipos de dados ou restrições
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'titulos'
ORDER BY 
    ordinal_position;

-- 9. Verificamos as restrições (constraints) na tabela
SELECT
    c.conname AS constraint_name,
    c.contype AS constraint_type,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM
    pg_constraint c
JOIN
    pg_namespace n ON n.oid = c.connamespace
JOIN
    pg_class cl ON cl.oid = c.conrelid
WHERE
    n.nspname = 'public'
    AND cl.relname = 'titulos';
