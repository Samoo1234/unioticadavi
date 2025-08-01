-- Script simples para corrigir a tabela medicos
-- Execute este script no SQL Editor do Supabase

-- Adicionar coluna ativo se não existir
ALTER TABLE medicos ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- Atualizar registros existentes para garantir que ativo = true
UPDATE medicos SET ativo = true WHERE ativo IS NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_medicos_ativo ON medicos(ativo);

-- Verificar resultado
SELECT 'Coluna ativo adicionada com sucesso!' as resultado;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'medicos' ORDER BY ordinal_position;