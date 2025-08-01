-- Script para verificar e corrigir a estrutura da tabela datas_disponiveis
-- Problema: A tabela foi migrada de cidade_id para filial_id, mas falta medico_id

-- 1. Verificar estrutura atual da tabela
SELECT 
    'ESTRUTURA ATUAL:' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'datas_disponiveis'
ORDER BY ordinal_position;

-- 2. Verificar se a coluna medico_id existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' 
        AND column_name = 'medico_id'
    ) THEN
        -- Adicionar coluna medico_id
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

-- 3. Verificar se a coluna filial_id existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' 
        AND column_name = 'filial_id'
    ) THEN
        -- Adicionar coluna filial_id
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

-- 4. Verificar estrutura final
SELECT 
    'ESTRUTURA FINAL:' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'datas_disponiveis'
ORDER BY ordinal_position;

-- 5. Verificar dados existentes
SELECT 
    'DADOS EXISTENTES:' as info,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN medico_id IS NOT NULL THEN 1 END) as com_medico_id,
    COUNT(CASE WHEN filial_id IS NOT NULL THEN 1 END) as com_filial_id
FROM datas_disponiveis;

-- 6. Mostrar alguns registros de exemplo
SELECT 
    'EXEMPLO DE REGISTROS:' as info,
    id,
    filial_id,
    medico_id,
    data,
    ativa
FROM datas_disponiveis 
ORDER BY id 
LIMIT 5;

-- 7. Verificar constraints
SELECT 
    'CONSTRAINTS:' as info,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'datas_disponiveis';

-- 8. Verificar índices
SELECT 
    'ÍNDICES:' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'datas_disponiveis'; 