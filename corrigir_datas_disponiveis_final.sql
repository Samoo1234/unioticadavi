-- Script FINAL para corrigir a tabela datas_disponiveis
-- Baseado na análise: falta apenas a coluna 'ativa'

BEGIN;

-- 1. Adicionar coluna ativa se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' 
        AND column_name = 'ativa'
    ) THEN
        -- Adicionar coluna ativa
        ALTER TABLE datas_disponiveis ADD COLUMN ativa BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE '✅ Coluna ativa adicionada com sucesso!';
        
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_datas_disponiveis_ativa 
        ON datas_disponiveis(ativa);
        RAISE NOTICE '✅ Índice para coluna ativa criado!';
        
    ELSE
        RAISE NOTICE 'ℹ️ Coluna ativa já existe';
    END IF;
END $$;

-- 2. Verificar se a coluna foi adicionada
SELECT 
    'VERIFICAÇÃO FINAL:' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'datas_disponiveis' 
AND column_name = 'ativa';

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

-- 4. Testar consulta que estava dando erro
SELECT 
    'TESTE DE CONSULTA:' as info,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN ativa = true THEN 1 END) as ativas,
    COUNT(CASE WHEN ativa = false THEN 1 END) as inativas
FROM datas_disponiveis;

-- 5. Mostrar alguns registros de exemplo
SELECT 
    'EXEMPLO DE REGISTROS:' as info,
    id,
    data,
    medico_id,
    filial_id,
    ativa,
    status
FROM datas_disponiveis 
ORDER BY created_at DESC 
LIMIT 3;

COMMIT;

-- 6. Resumo final
SELECT '🎉 CORREÇÃO CONCLUÍDA!' as resultado;
SELECT '✅ Coluna ativa adicionada com sucesso' as status;
SELECT '✅ Aplicação deve funcionar agora' as proximo_passo; 