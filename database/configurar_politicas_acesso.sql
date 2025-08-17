-- Configuração de políticas de acesso RLS para as tabelas filiais e fornecedores
-- Este script configura políticas que permitem ao usuário autenticado acessar os dados

-- Habilitar RLS nas tabelas (caso já não esteja habilitado)
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- Verificar se as políticas já existem e removê-las se necessário
DROP POLICY IF EXISTS policy_filiais_select ON public.filiais;
DROP POLICY IF EXISTS policy_fornecedores_select ON public.fornecedores;

-- Criar política para permitir SELECT na tabela filiais
CREATE POLICY policy_filiais_select
  ON public.filiais
  FOR SELECT
  TO authenticated
  USING (true);

-- Criar política para permitir SELECT na tabela fornecedores
CREATE POLICY policy_fornecedores_select
  ON public.fornecedores
  FOR SELECT
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
    tablename IN ('filiais', 'fornecedores');
