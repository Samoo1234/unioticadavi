-- Script para verificar a estrutura atual da tabela datas_disponiveis

-- 1. Verificar se a tabela existe
SELECT 
    'TABELA EXISTE:' as info,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'datas_disponiveis' 
        AND table_schema = 'public'
    ) as tabela_existe;

-- 2. Verificar estrutura atual da tabela
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

-- 3. Verificar constraints
SELECT 
    'CONSTRAINTS:' as info,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'datas_disponiveis';

-- 4. Verificar foreign keys
SELECT 
    'FOREIGN KEYS:' as info,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'datas_disponiveis';

-- 5. Verificar índices
SELECT 
    'ÍNDICES:' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'datas_disponiveis';

-- 6. Verificar dados existentes
SELECT 
    'DADOS EXISTENTES:' as info,
    COUNT(*) as total_registros
FROM datas_disponiveis;

-- 7. Mostrar alguns registros de exemplo
SELECT 
    'EXEMPLO DE REGISTROS:' as info,
    id,
    filial_id,
    medico_id,
    data,
    ativa,
    created_at
FROM datas_disponiveis 
ORDER BY id 
LIMIT 5;

-- 8. Verificar se as tabelas relacionadas existem
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
) t; 