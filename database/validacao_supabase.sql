-- =============================================
-- SCRIPT DE VALIDAÇÃO PÓS-MIGRAÇÃO - SUPABASE
-- Execute após a migração para verificar se tudo está correto
-- =============================================

-- SEÇÃO 1: VERIFICAR ESTRUTURA DAS TABELAS
-- =============================================

SELECT '=== VERIFICAÇÃO DE TABELAS ===' as secao;

-- Verificar se as tabelas principais existem
SELECT 
    'Tabelas Principais' as categoria,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✓ OK' ELSE '✗ ERRO' END as status
FROM (
    VALUES 
        ('filiais'),
        ('cidades'),
        ('fornecedores'),
        ('usuarios'),
        ('clientes')
) AS expected_tables(table_name)
LEFT JOIN information_schema.tables t 
    ON t.table_name = expected_tables.table_name 
    AND t.table_schema = 'public'
ORDER BY expected_tables.table_name;

-- SEÇÃO 2: VERIFICAR ESTRUTURA DA TABELA FORNECEDORES
-- =============================================

SELECT '=== ESTRUTURA FORNECEDORES ===' as secao;

SELECT 
    'Colunas da tabela fornecedores' as categoria,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'fornecedores'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- SEÇÃO 3: VERIFICAR ÍNDICES
-- =============================================

SELECT '=== VERIFICAÇÃO DE ÍNDICES ===' as secao;

-- Verificar índices da tabela fornecedores
SELECT 
    'Índices fornecedores' as categoria,
    indexname,
    CASE WHEN indexname IS NOT NULL THEN '✓ OK' ELSE '✗ ERRO' END as status
FROM pg_indexes
WHERE tablename = 'fornecedores'
ORDER BY indexname;

-- Verificar se os índices esperados existem
SELECT 
    'Índices Esperados' as categoria,
    expected_index,
    CASE WHEN actual_index IS NOT NULL THEN '✓ OK' ELSE '✗ FALTANDO' END as status
FROM (
    VALUES 
        ('idx_fornecedores_filial_id'),
        ('idx_fornecedores_ativo'),
        ('idx_fornecedores_nome'),
        ('idx_fornecedores_cnpj')
) AS expected(expected_index)
LEFT JOIN pg_indexes pi 
    ON pi.indexname = expected.expected_index 
    AND pi.tablename = 'fornecedores'
ORDER BY expected.expected_index;

-- SEÇÃO 4: VERIFICAR TRIGGERS
-- =============================================

SELECT '=== VERIFICAÇÃO DE TRIGGERS ===' as secao;

-- Verificar triggers da tabela fornecedores
SELECT 
    'Triggers fornecedores' as categoria,
    trigger_name,
    event_manipulation,
    CASE WHEN trigger_name IS NOT NULL THEN '✓ OK' ELSE '✗ ERRO' END as status
FROM information_schema.triggers
WHERE event_object_table = 'fornecedores'
ORDER BY trigger_name;

-- SEÇÃO 5: VERIFICAR RLS (ROW LEVEL SECURITY)
-- =============================================

SELECT '=== VERIFICAÇÃO RLS ===' as secao;

-- Verificar se RLS está habilitado
SELECT 
    'RLS Status' as categoria,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado,
    CASE WHEN rowsecurity THEN '✓ RLS HABILITADO' ELSE '✗ RLS DESABILITADO' END as status
FROM pg_tables
WHERE tablename = 'fornecedores'
    AND schemaname = 'public';

-- Verificar políticas RLS
SELECT 
    'Políticas RLS' as categoria,
    policyname,
    cmd as operacao,
    CASE WHEN policyname IS NOT NULL THEN '✓ OK' ELSE '✗ ERRO' END as status
FROM pg_policies
WHERE tablename = 'fornecedores'
ORDER BY policyname;

-- SEÇÃO 6: VERIFICAR FOREIGN KEYS
-- =============================================

SELECT '=== VERIFICAÇÃO FOREIGN KEYS ===' as secao;

-- Verificar foreign keys da tabela fornecedores
SELECT 
    'Foreign Keys fornecedores' as categoria,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✓ OK' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'fornecedores'
ORDER BY tc.constraint_name;

-- SEÇÃO 7: TESTE FUNCIONAL
-- =============================================

SELECT '=== TESTE FUNCIONAL ===' as secao;

-- Teste de inserção
DO $$
DECLARE
    test_filial_id BIGINT;
    test_fornecedor_id BIGINT;
BEGIN
    -- Buscar uma filial para teste
    SELECT id INTO test_filial_id FROM filiais LIMIT 1;
    
    IF test_filial_id IS NOT NULL THEN
        -- Inserir fornecedor de teste
        INSERT INTO fornecedores (nome, cnpj, telefone, email, filial_id)
        VALUES ('Teste Fornecedor Validação', '12.345.678/0001-90', '(11) 99999-9999', 'teste@fornecedor.com', test_filial_id)
        RETURNING id INTO test_fornecedor_id;
        
        -- Verificar se foi inserido
        IF test_fornecedor_id IS NOT NULL THEN
            RAISE NOTICE 'TESTE INSERÇÃO: ✓ OK - Fornecedor inserido com ID %', test_fornecedor_id;
            
            -- Teste de atualização
            UPDATE fornecedores 
            SET observacoes = 'Teste de atualização realizado em ' || NOW()
            WHERE id = test_fornecedor_id;
            
            RAISE NOTICE 'TESTE ATUALIZAÇÃO: ✓ OK - Fornecedor atualizado';
            
            -- Limpar teste
            DELETE FROM fornecedores WHERE id = test_fornecedor_id;
            RAISE NOTICE 'TESTE LIMPEZA: ✓ OK - Fornecedor de teste removido';
        ELSE
            RAISE NOTICE 'TESTE INSERÇÃO: ✗ ERRO - Falha ao inserir fornecedor';
        END IF;
    ELSE
        RAISE NOTICE 'TESTE: ✗ ERRO - Nenhuma filial encontrada para teste';
    END IF;
END $$;

-- SEÇÃO 8: CONTAGEM DE REGISTROS
-- =============================================

SELECT '=== CONTAGEM DE REGISTROS ===' as secao;

-- Contar registros nas tabelas principais
SELECT 
    'Contagem de Registros' as categoria,
    'filiais' as tabela,
    COUNT(*) as total_registros
FROM filiais
UNION ALL
SELECT 
    'Contagem de Registros' as categoria,
    'cidades' as tabela,
    COUNT(*) as total_registros
FROM cidades
UNION ALL
SELECT 
    'Contagem de Registros' as categoria,
    'fornecedores' as tabela,
    COUNT(*) as total_registros
FROM fornecedores
UNION ALL
SELECT 
    'Contagem de Registros' as categoria,
    'usuarios' as tabela,
    COUNT(*) as total_registros
FROM usuarios
UNION ALL
SELECT 
    'Contagem de Registros' as categoria,
    'clientes' as tabela,
    COUNT(*) as total_registros
FROM clientes
ORDER BY tabela;

-- SEÇÃO 9: VERIFICAR INTEGRIDADE DOS DADOS
-- =============================================

SELECT '=== VERIFICAÇÃO DE INTEGRIDADE ===' as secao;

-- Verificar se há fornecedores com filial_id inválido
SELECT 
    'Integridade Dados' as categoria,
    'Fornecedores com filial_id inválido' as verificacao,
    COUNT(*) as problemas_encontrados,
    CASE WHEN COUNT(*) = 0 THEN '✓ OK' ELSE '✗ PROBLEMAS ENCONTRADOS' END as status
FROM fornecedores f
LEFT JOIN filiais fi ON f.filial_id = fi.id
WHERE f.filial_id IS NOT NULL AND fi.id IS NULL;

-- Verificar se há registros com timestamps inválidos
SELECT 
    'Integridade Dados' as categoria,
    'Fornecedores com timestamps inválidos' as verificacao,
    COUNT(*) as problemas_encontrados,
    CASE WHEN COUNT(*) = 0 THEN '✓ OK' ELSE '✗ PROBLEMAS ENCONTRADOS' END as status
FROM fornecedores
WHERE created_at IS NULL OR updated_at IS NULL;

-- SEÇÃO 10: RESUMO FINAL
-- =============================================

SELECT '=== RESUMO DA VALIDAÇÃO ===' as secao;

SELECT 
    'RESUMO FINAL' as categoria,
    'Migração da tabela fornecedores' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fornecedores')
        AND EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'fornecedores')
        AND EXISTS (SELECT 1 FROM information_schema.triggers WHERE event_object_table = 'fornecedores')
        AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fornecedores')
        THEN '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO'
        ELSE '❌ MIGRAÇÃO INCOMPLETA - VERIFICAR ERROS ACIMA'
    END as status;

SELECT 
    'PRÓXIMOS PASSOS' as categoria,
    '1. Atualizar tipos TypeScript' as passo
UNION ALL
SELECT 
    'PRÓXIMOS PASSOS' as categoria,
    '2. Testar interface do usuário' as passo
UNION ALL
SELECT 
    'PRÓXIMOS PASSOS' as categoria,
    '3. Fazer backup do banco' as passo
ORDER BY passo;