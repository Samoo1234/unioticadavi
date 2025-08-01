-- Script para adicionar a coluna 'ativo' na tabela medicos
-- Execute este script no SQL Editor do Supabase

-- =============================================
-- VERIFICAR SE A COLUNA ATIVO EXISTE
-- =============================================

SELECT 'Verificando se a coluna ativo existe na tabela medicos...' as status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'medicos' AND column_name = 'ativo' AND table_schema = 'public') 
    THEN 'Coluna ativo JÁ EXISTE na tabela medicos'
    ELSE 'Coluna ativo NÃO EXISTE na tabela medicos - será adicionada'
  END as verificacao_inicial;

-- =============================================
-- ADICIONAR COLUNA ATIVO SE NÃO EXISTIR
-- =============================================

-- Adicionar coluna ativo na tabela medicos
DO $$
BEGIN
    -- Verificar se a coluna não existe antes de adicionar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medicos' 
        AND column_name = 'ativo' 
        AND table_schema = 'public'
    ) THEN
        -- Adicionar a coluna
        ALTER TABLE medicos ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Coluna ativo adicionada com sucesso à tabela medicos';
    ELSE
        RAISE NOTICE 'Coluna ativo já existe na tabela medicos';
    END IF;
END $$;

-- =============================================
-- ATUALIZAR REGISTROS EXISTENTES
-- =============================================

-- Garantir que todos os médicos existentes tenham ativo = true
UPDATE medicos 
SET ativo = true 
WHERE ativo IS NULL;

-- =============================================
-- CRIAR ÍNDICE PARA PERFORMANCE
-- =============================================

-- Criar índice na coluna ativo para melhor performance
CREATE INDEX IF NOT EXISTS idx_medicos_ativo ON medicos(ativo);

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================

SELECT 'Verificação final da estrutura da tabela medicos:' as status;

-- Mostrar estrutura atual da tabela medicos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'medicos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se a coluna ativo foi criada com sucesso
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'medicos' AND column_name = 'ativo' AND table_schema = 'public') 
    THEN 'SUCESSO: Coluna ativo EXISTE na tabela medicos'
    ELSE 'ERRO: Coluna ativo ainda NÃO EXISTE na tabela medicos'
  END as verificacao_final;

-- Contar quantos médicos existem
SELECT 
    COUNT(*) as total_medicos,
    COUNT(CASE WHEN ativo = true THEN 1 END) as medicos_ativos,
    COUNT(CASE WHEN ativo = false THEN 1 END) as medicos_inativos
FROM medicos;

SELECT 'Script executado com sucesso! A coluna ativo foi adicionada à tabela medicos.' as resultado;