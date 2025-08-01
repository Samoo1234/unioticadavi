-- Script completo para corrigir a estrutura da tabela datas_disponiveis
-- Este script resolve os problemas de estrutura da tabela

BEGIN;

-- 1. Verificar estrutura atual
SELECT '=== ESTRUTURA ATUAL ===' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'datas_disponiveis'
ORDER BY ordinal_position;

-- 2. Adicionar coluna medico_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' 
        AND column_name = 'medico_id'
    ) THEN
        ALTER TABLE datas_disponiveis ADD COLUMN medico_id BIGINT;
        RAISE NOTICE 'Adicionada coluna medico_id em datas_disponiveis';
        
        -- Definir um médico padrão para registros existentes
        UPDATE datas_disponiveis 
        SET medico_id = (
            SELECT MIN(id) FROM medicos WHERE ativo = true
        ) 
        WHERE medico_id IS NULL;
        
        -- Tornar a coluna NOT NULL após preencher os dados
        ALTER TABLE datas_disponiveis ALTER COLUMN medico_id SET NOT NULL;
        
        -- Adicionar foreign key constraint
        ALTER TABLE datas_disponiveis 
        ADD CONSTRAINT fk_datas_disponiveis_medico 
        FOREIGN KEY (medico_id) REFERENCES medicos(id);
        
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_datas_disponiveis_medico_id 
        ON datas_disponiveis(medico_id);
        
        RAISE NOTICE 'Configuração da coluna medico_id concluída';
    ELSE
        RAISE NOTICE 'Coluna medico_id já existe';
    END IF;
END $$;

-- 3. Adicionar coluna filial_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' 
        AND column_name = 'filial_id'
    ) THEN
        ALTER TABLE datas_disponiveis ADD COLUMN filial_id BIGINT;
        RAISE NOTICE 'Adicionada coluna filial_id em datas_disponiveis';
        
        -- Definir uma filial padrão para registros existentes
        UPDATE datas_disponiveis 
        SET filial_id = (
            SELECT MIN(id) FROM filiais WHERE ativa = true
        ) 
        WHERE filial_id IS NULL;
        
        -- Tornar a coluna NOT NULL após preencher os dados
        ALTER TABLE datas_disponiveis ALTER COLUMN filial_id SET NOT NULL;
        
        -- Adicionar foreign key constraint
        ALTER TABLE datas_disponiveis 
        ADD CONSTRAINT fk_datas_disponiveis_filial 
        FOREIGN KEY (filial_id) REFERENCES filiais(id);
        
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_datas_disponiveis_filial_id 
        ON datas_disponiveis(filial_id);
        
        RAISE NOTICE 'Configuração da coluna filial_id concluída';
    ELSE
        RAISE NOTICE 'Coluna filial_id já existe';
    END IF;
END $$;

-- 4. Remover coluna cidade_id se existir (migração completa)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' 
        AND column_name = 'cidade_id'
    ) THEN
        -- Remover foreign key constraint se existir
        ALTER TABLE datas_disponiveis DROP CONSTRAINT IF EXISTS datas_disponiveis_cidade_id_fkey;
        
        -- Remover índice se existir
        DROP INDEX IF EXISTS idx_datas_disponiveis_cidade_id;
        
        -- Remover coluna
        ALTER TABLE datas_disponiveis DROP COLUMN cidade_id;
        
        RAISE NOTICE 'Coluna cidade_id removida (migração completa)';
    ELSE
        RAISE NOTICE 'Coluna cidade_id não existe';
    END IF;
END $$;

-- 5. Verificar estrutura final
SELECT '=== ESTRUTURA FINAL ===' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'datas_disponiveis'
ORDER BY ordinal_position;

-- 6. Verificar dados existentes
SELECT '=== DADOS EXISTENTES ===' as info;
SELECT 
    COUNT(*) as total_registros,
    COUNT(CASE WHEN medico_id IS NOT NULL THEN 1 END) as com_medico_id,
    COUNT(CASE WHEN filial_id IS NOT NULL THEN 1 END) as com_filial_id,
    COUNT(CASE WHEN ativa = true THEN 1 END) as ativas
FROM datas_disponiveis;

-- 7. Mostrar alguns registros de exemplo
SELECT '=== EXEMPLO DE REGISTROS ===' as info;
SELECT 
    id,
    filial_id,
    medico_id,
    data,
    ativa,
    created_at
FROM datas_disponiveis 
ORDER BY id 
LIMIT 5;

-- 8. Verificar constraints
SELECT '=== CONSTRAINTS ===' as info;
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'datas_disponiveis';

-- 9. Verificar foreign keys
SELECT '=== FOREIGN KEYS ===' as info;
SELECT 
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

-- 10. Verificar índices
SELECT '=== ÍNDICES ===' as info;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'datas_disponiveis';

-- 11. Testar consulta básica
SELECT '=== TESTE DE CONSULTA ===' as info;
SELECT 
    dd.id,
    dd.filial_id,
    dd.medico_id,
    dd.data,
    f.nome as filial_nome,
    m.nome as medico_nome
FROM datas_disponiveis dd
LEFT JOIN filiais f ON f.id = dd.filial_id
LEFT JOIN medicos m ON m.id = dd.medico_id
WHERE dd.ativa = true
ORDER BY dd.data
LIMIT 3;

COMMIT;

SELECT '🎉 CORREÇÃO CONCLUÍDA!' as resultado;
SELECT '✅ Tabela datas_disponiveis agora tem a estrutura correta' as status;
SELECT '📝 Colunas: id, filial_id, medico_id, data, horarios_disponiveis, ativa, created_at, updated_at' as estrutura; 