-- Script para corrigir problemas de RLS (Row Level Security) na tabela titulos

-- 1. Primeiro verificar as políticas RLS existentes
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'titulos';

-- 2. Desativar RLS temporariamente para permitir atualizações
ALTER TABLE titulos DISABLE ROW LEVEL SECURITY;

-- 3. Realizar as atualizações necessárias
-- Atualizar registros com tipo='pagar' para usar o tipo_id correto
UPDATE titulos SET tipo_id = 1 WHERE tipo = 'pagar' AND tipo_id IS NULL;

-- Atualizar outros registros com base no campo tipo
UPDATE titulos SET tipo_id = 2 WHERE tipo ILIKE 'arma%' AND tipo_id IS NULL;
UPDATE titulos SET tipo_id = 1 WHERE tipo ILIKE 'lente%' AND tipo_id IS NULL;

-- 4. Verificar se ainda existem registros com tipo_id NULL
SELECT COUNT(*) FROM titulos WHERE tipo_id IS NULL;

-- 5. Corrigir as políticas RLS específicas para a tabela titulos
-- Primeiro, dropar a política existente que está causando problemas
DROP POLICY IF EXISTS policy_titulos_select ON titulos;

-- Recriar a política com permissões corretas
-- Ajuste isso conforme necessário para seu caso específico, isto é apenas um exemplo
CREATE POLICY policy_titulos_select ON titulos
    FOR SELECT
    USING (
        auth.uid() = 'authenticated' OR 
        EXISTS (SELECT 1 FROM usuarios WHERE auth.uid() = usuarios.id)
    );

-- 6. Reativar RLS com as políticas corrigidas
ALTER TABLE titulos ENABLE ROW LEVEL SECURITY;

-- 7. Verificar as políticas atualizadas
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'titulos';
