-- Script completo para resolver problemas de UUID vs INTEGER
-- Este script corrige todas as inconsistências de tipos no banco de dados

-- 1. Verificar estrutura atual das tabelas principais
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('agendamentos', 'clientes', 'datas_disponiveis', 'configuracoes_horarios')
    AND column_name LIKE '%_id'
ORDER BY table_name, column_name;

-- 2. Remover constraints que referenciam cidade_id (se existirem)
DO $$ 
BEGIN
    -- Remover constraint de agendamentos se existir
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name LIKE '%agendamentos%cidade%' 
               AND table_name = 'agendamentos') THEN
        ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_cidade_id_fkey;
    END IF;
    
    -- Remover constraint de clientes se existir
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name LIKE '%clientes%cidade%' 
               AND table_name = 'clientes') THEN
        ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_cidade_id_fkey;
    END IF;
END $$;

-- 3. Remover colunas cidade_id obsoletas (se existirem)
DO $$ 
BEGIN
    -- Remover cidade_id de agendamentos se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'agendamentos' AND column_name = 'cidade_id') THEN
        ALTER TABLE agendamentos DROP COLUMN cidade_id;
    END IF;
    
    -- Remover cidade_id de clientes se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'clientes' AND column_name = 'cidade_id') THEN
        ALTER TABLE clientes DROP COLUMN cidade_id;
    END IF;
    
    -- Remover cidade_id de datas_disponiveis se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'datas_disponiveis' AND column_name = 'cidade_id') THEN
        ALTER TABLE datas_disponiveis DROP COLUMN cidade_id;
    END IF;
    
    -- Remover cidade_id de configuracoes_horarios se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'configuracoes_horarios' AND column_name = 'cidade_id') THEN
        ALTER TABLE configuracoes_horarios DROP COLUMN cidade_id;
    END IF;
END $$;

-- 4. Garantir que filial_id seja NOT NULL onde necessário
DO $$ 
BEGIN
    -- Atualizar agendamentos para garantir filial_id NOT NULL
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'agendamentos' AND column_name = 'filial_id' AND is_nullable = 'YES') THEN
        -- Primeiro, definir um valor padrão para registros NULL (assumindo filial_id = 1 como padrão)
        UPDATE agendamentos SET filial_id = 1 WHERE filial_id IS NULL;
        -- Depois alterar para NOT NULL
        ALTER TABLE agendamentos ALTER COLUMN filial_id SET NOT NULL;
    END IF;
END $$;

-- 5. Verificar estrutura final
SELECT 
    'ESTRUTURA FINAL:' as status,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('agendamentos', 'clientes', 'datas_disponiveis', 'configuracoes_horarios')
    AND column_name LIKE '%_id'
ORDER BY table_name, column_name;

-- 6. Verificar se ainda existem referências a UUID
SELECT 
    'VERIFICAÇÃO UUID:' as status,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE data_type = 'uuid'
    AND table_name IN ('agendamentos', 'clientes', 'datas_disponiveis', 'configuracoes_horarios');

SELECT 'SCRIPT EXECUTADO COM SUCESSO!' as resultado;