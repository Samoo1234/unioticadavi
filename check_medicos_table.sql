-- Script para verificar a estrutura da tabela medicos
-- Execute este script no SQL Editor do Supabase

-- =============================================
-- VERIFICAR ESTRUTURA DA TABELA MEDICOS
-- =============================================

SELECT 'Verificando estrutura da tabela medicos...' as status;

-- Verificar se a tabela medicos existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'medicos'
) as tabela_existe;

-- Verificar todas as colunas da tabela medicos
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'medicos'
ORDER BY ordinal_position;

-- Verificar especificamente se a coluna 'ativo' existe
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'medicos'
  AND column_name = 'ativo'
) as coluna_ativo_existe;

-- Se a coluna 'ativo' não existir, adicionar ela
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'medicos'
    AND column_name = 'ativo'
  ) THEN
    ALTER TABLE medicos ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT true;
    RAISE NOTICE 'Coluna ativo adicionada à tabela medicos';
  ELSE
    RAISE NOTICE 'Coluna ativo já existe na tabela medicos';
  END IF;
END
$$;

-- Verificar novamente a estrutura após possível alteração
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'medicos'
ORDER BY ordinal_position;

-- Verificar alguns registros da tabela medicos
SELECT COUNT(*) as total_medicos FROM medicos;

SELECT id, nome, crm, ativo 
FROM medicos 
LIMIT 5;

SELECT 'Verificação da tabela medicos concluída!' as resultado;