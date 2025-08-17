-- Script para corrigir problemas de acesso à tabela tipos_fornecedores
-- Este script verifica se a tabela existe e configura as permissões corretas

-- Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'tipos_fornecedores'
) AS tabela_existe;

-- Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'tipos_fornecedores'
ORDER BY 
    ordinal_position;

-- Verificar políticas RLS na tabela
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
    tablename = 'tipos_fornecedores';

-- Habilitar RLS na tabela tipos_fornecedores
ALTER TABLE public.tipos_fornecedores ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS policy_tipos_fornecedores_select ON public.tipos_fornecedores;

-- Criar política para permitir SELECT para todos os usuários autenticados
CREATE POLICY policy_tipos_fornecedores_select
  ON public.tipos_fornecedores
  FOR SELECT
  TO authenticated
  USING (true);

-- Verificar se há registros na tabela
SELECT 
    COUNT(*) AS total_tipos_fornecedores,
    ARRAY_AGG(nome) AS nomes_tipos
FROM 
    public.tipos_fornecedores;

-- Verificar permissões do usuário na tabela
SELECT 
    grantee, 
    table_catalog, 
    table_schema, 
    table_name, 
    privilege_type
FROM 
    information_schema.table_privileges 
WHERE 
    table_name = 'tipos_fornecedores'
ORDER BY 
    grantee, 
    privilege_type;

-- Conceder permissões de SELECT para o usuário authenticated
GRANT SELECT ON TABLE public.tipos_fornecedores TO authenticated;

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
    tablename = 'tipos_fornecedores';
