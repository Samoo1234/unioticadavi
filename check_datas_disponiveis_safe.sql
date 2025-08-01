-- Script de verificação SEGURO para a tabela datas_disponiveis
-- Este script não assume a existência de colunas específicas

-- 1. Verificar se a tabela existe
SELECT 
    'TABELA EXISTE:' as info,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'datas_disponiveis' 
        AND table_schema = 'public'
    ) as tabela_existe;

-- 2. Verificar estrutura atual da tabela (SE EXISTIR)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'datas_disponiveis' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '=== ESTRUTURA ATUAL DA TABELA ===';
    ELSE
        RAISE NOTICE 'TABELA datas_disponiveis NÃO EXISTE!';
        RETURN;
    END IF;
END $$;

-- 3. Mostrar estrutura atual (se tabela existir)
SELECT 
    'ESTRUTURA ATUAL:' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'datas_disponiveis'
ORDER BY ordinal_position;

-- 4. Verificar se colunas específicas existem
SELECT 
    'VERIFICAÇÃO DE COLUNAS:' as info,
    'id' as coluna,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' 
        AND column_name = 'id'
    ) as existe
UNION ALL
SELECT 
    'VERIFICAÇÃO DE COLUNAS:' as info,
    'filial_id' as coluna,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' 
        AND column_name = 'filial_id'
    ) as existe
UNION ALL
SELECT 
    'VERIFICAÇÃO DE COLUNAS:' as info,
    'medico_id' as coluna,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' 
        AND column_name = 'medico_id'
    ) as existe
UNION ALL
SELECT 
    'VERIFICAÇÃO DE COLUNAS:' as info,
    'cidade_id' as coluna,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' 
        AND column_name = 'cidade_id'
    ) as existe
UNION ALL
SELECT 
    'VERIFICAÇÃO DE COLUNAS:' as info,
    'data' as coluna,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' 
        AND column_name = 'data'
    ) as existe
UNION ALL
SELECT 
    'VERIFICAÇÃO DE COLUNAS:' as info,
    'ativa' as coluna,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' 
        AND column_name = 'ativa'
    ) as existe;

-- 5. Verificar constraints (se tabela existir)
SELECT 
    'CONSTRAINTS:' as info,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'datas_disponiveis';

-- 6. Verificar dados existentes (se tabela existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'datas_disponiveis' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '=== DADOS EXISTENTES ===';
    END IF;
END $$;

-- 7. Contar registros (se tabela existir)
SELECT 
    'TOTAL DE REGISTROS:' as info,
    COUNT(*) as total
FROM datas_disponiveis;

-- 8. Mostrar alguns registros (se tabela existir e tiver dados)
DO $$
DECLARE
    colunas_existentes text := '';
    query_text text;
BEGIN
    -- Construir lista de colunas existentes
    SELECT string_agg(column_name, ', ') INTO colunas_existentes
    FROM information_schema.columns 
    WHERE table_name = 'datas_disponiveis'
    ORDER BY ordinal_position;
    
    IF colunas_existentes IS NOT NULL AND colunas_existentes != '' THEN
        query_text := 'SELECT ''EXEMPLO DE REGISTROS:'' as info, ' || colunas_existentes || 
                     ' FROM datas_disponiveis ORDER BY id LIMIT 3';
        EXECUTE query_text;
    END IF;
END $$;

-- 9. Verificar se tabelas relacionadas existem
SELECT 
    'TABELAS RELACIONADAS:' as info,
    table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = t.table_name 
        AND table_schema = 'public'
    ) as existe
FROM (
    SELECT 'filiais' as table_name
    UNION SELECT 'medicos'
    UNION SELECT 'cidades'
) t;

-- 10. Resumo das ações necessárias
SELECT 
    'RESUMO DAS AÇÕES NECESSÁRIAS:' as info,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'datas_disponiveis') 
        THEN 'CRIAR TABELA datas_disponiveis'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datas_disponiveis' AND column_name = 'medico_id')
        THEN 'ADICIONAR COLUNA medico_id'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datas_disponiveis' AND column_name = 'filial_id')
        THEN 'ADICIONAR COLUNA filial_id'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'datas_disponiveis' AND column_name = 'ativa')
        THEN 'ADICIONAR COLUNA ativa'
        ELSE 'ESTRUTURA OK - APENAS VERIFICAR DADOS'
    END as acao_necessaria; 