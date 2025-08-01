-- Script para simplificar a tabela filiais no Supabase
-- Execute este código diretamente no SQL Editor do Supabase

-- 1. Verificar estrutura atual da tabela filiais
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'filiais' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Remover as colunas desnecessárias
ALTER TABLE public.filiais 
DROP COLUMN IF EXISTS endereco CASCADE,
DROP COLUMN IF EXISTS telefone CASCADE,
DROP COLUMN IF EXISTS responsavel CASCADE;

-- 3. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'filiais' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar dados existentes
SELECT id, nome, ativa, created_at, updated_at 
FROM public.filiais 
ORDER BY id;

-- Resultado esperado: tabela filiais com apenas as colunas:
-- id, nome, ativa, created_at, updated_at