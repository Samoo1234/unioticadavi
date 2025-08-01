-- Script para adicionar a coluna horarios_disponiveis
-- Esta coluna está faltando e causando erro na aplicação

BEGIN;

-- 1. Adicionar coluna horarios_disponiveis se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' 
        AND column_name = 'horarios_disponiveis'
    ) THEN
        -- Adicionar coluna horarios_disponiveis
        ALTER TABLE datas_disponiveis ADD COLUMN horarios_disponiveis JSONB NOT NULL DEFAULT '[]';
        RAISE NOTICE '✅ Coluna horarios_disponiveis adicionada com sucesso!';
        
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_datas_disponiveis_horarios 
        ON datas_disponiveis USING GIN (horarios_disponiveis);
        RAISE NOTICE '✅ Índice GIN para horarios_disponiveis criado!';
        
    ELSE
        RAISE NOTICE 'ℹ️ Coluna horarios_disponiveis já existe';
    END IF;
END $$;

-- 2. Verificar se a coluna foi adicionada
SELECT 
    'VERIFICAÇÃO HORARIOS:' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'datas_disponiveis' 
AND column_name = 'horarios_disponiveis';

-- 3. Verificar estrutura completa final
SELECT 
    'ESTRUTURA COMPLETA FINAL:' as info,
    column_name, 
    data_type, 
    is_nullable,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'datas_disponiveis'
ORDER BY ordinal_position;

-- 4. Testar consulta com horarios_disponiveis
SELECT 
    'TESTE DE CONSULTA COM HORARIOS:' as info,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN ativa = true THEN 1 END) as ativas,
    COUNT(CASE WHEN horarios_disponiveis IS NOT NULL THEN 1 END) as com_horarios
FROM datas_disponiveis;

-- 5. Mostrar alguns registros com horarios
SELECT 
    'EXEMPLO DE REGISTROS COM HORARIOS:' as info,
    id,
    data,
    medico_id,
    filial_id,
    ativa,
    horarios_disponiveis
FROM datas_disponiveis 
ORDER BY created_at DESC 
LIMIT 3;

COMMIT;

-- 6. Resumo final
SELECT '🎉 HORARIOS_DISPONIVEIS ADICIONADA!' as resultado;
SELECT '✅ Coluna horarios_disponiveis adicionada com sucesso' as status;
SELECT '✅ Aplicação deve funcionar completamente agora' as proximo_passo; 