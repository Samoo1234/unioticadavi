-- Script para configurar políticas de acesso RLS para a tabela titulos
-- Este script cria políticas que permitem ao usuário autenticado acessar e modificar dados na tabela titulos

-- Verificar se RLS está habilitado na tabela titulos
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'titulos';

-- Habilitar RLS na tabela titulos
ALTER TABLE public.titulos ENABLE ROW LEVEL SECURITY;

-- Verificar as políticas existentes e removê-las se necessário
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'titulos';

-- Remover políticas existentes
DROP POLICY IF EXISTS policy_titulos_select ON public.titulos;
DROP POLICY IF EXISTS policy_titulos_insert ON public.titulos;
DROP POLICY IF EXISTS policy_titulos_update ON public.titulos;
DROP POLICY IF EXISTS policy_titulos_delete ON public.titulos;

-- Criar política para permitir SELECT na tabela titulos para todos os usuários autenticados
CREATE POLICY policy_titulos_select
  ON public.titulos
  FOR SELECT
  TO authenticated
  USING (true);

-- Criar política para permitir INSERT na tabela titulos para todos os usuários autenticados
CREATE POLICY policy_titulos_insert
  ON public.titulos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Criar política para permitir UPDATE na tabela titulos para todos os usuários autenticados
CREATE POLICY policy_titulos_update
  ON public.titulos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar política para permitir DELETE na tabela titulos para todos os usuários autenticados
CREATE POLICY policy_titulos_delete
  ON public.titulos
  FOR DELETE
  TO authenticated
  USING (true);

-- Verificar se as políticas foram criadas corretamente
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
