-- Script para adicionar a coluna 'ativo' à tabela medicos no Supabase
-- Execute este código diretamente no SQL Editor do Supabase

-- 1. Verificar estrutura atual da tabela medicos
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medicos' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar a coluna 'ativo' se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'medicos' 
            AND column_name = 'ativo'
            AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medicos ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Coluna ativo adicionada à tabela medicos';
    ELSE
        RAISE NOTICE 'Coluna ativo já existe na tabela medicos';
    END IF;
END $$;

-- 3. Atualizar registros existentes para ter ativo = true por padrão
UPDATE public.medicos SET ativo = true WHERE ativo IS NULL;

-- 4. Verificar estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medicos' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar dados existentes
SELECT id, nome, crm, especialidade, ativo, created_at, updated_at 
FROM public.medicos 
ORDER BY id;

-- Resultado esperado: tabela medicos com a coluna 'ativo' adicionada