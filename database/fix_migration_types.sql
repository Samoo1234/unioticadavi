-- =============================================
-- MIGRAÇÃO SIMPLIFICADA: USAR APENAS FILIAIS
-- Sistema de Gestão de Ótica
-- =============================================

-- EXPLICAÇÃO SIMPLES:
-- Vamos usar APENAS a tabela 'filiais' (nativa PostgreSQL)
-- E migrar todas as referências de 'cidade_id' para 'filial_id'
-- Sem mexer na tabela 'cidades' (Firebase)

-- =============================================
-- PASSO 1: VERIFICAR ESTRUTURA ATUAL
-- =============================================

SELECT 
    'ESTRUTURA ATUAL:' as status,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name IN ('id', 'cidade_id', 'filial_id')
    AND table_name IN ('cidades', 'filiais', 'agendamentos', 'clientes', 'datas_disponiveis', 'configuracoes_horarios')
ORDER BY table_name, column_name;

-- =============================================
-- PASSO 2: CRIAR FILIAIS BASEADAS EM CIDADES
-- =============================================

-- Inserir filiais para cada cidade (se não existir)
INSERT INTO filiais (nome, endereco, ativa, created_at, updated_at)
SELECT 
    c.nome,
    COALESCE('Endereço de ' || c.nome, 'Endereço não informado') as endereco,
    COALESCE(c.active, true) as ativa,
    COALESCE(c.created_at, NOW()) as created_at,
    COALESCE(c.updated_at, NOW()) as updated_at
FROM cidades c
WHERE NOT EXISTS (
    SELECT 1 FROM filiais f 
    WHERE LOWER(f.nome) = LOWER(c.nome)
);

-- =============================================
-- PASSO 3: MIGRAR REFERÊNCIAS PARA FILIAL_ID
-- =============================================

-- Criar tabela de mapeamento temporária
CREATE TEMP TABLE cidade_filial_map AS
SELECT 
    c.id as cidade_id,
    f.id as filial_id
FROM cidades c
JOIN filiais f ON LOWER(c.nome) = LOWER(f.nome);

-- Atualizar agendamentos: adicionar filial_id se não existir
DO $$
BEGIN
    -- Se agendamentos não tem filial_id, adicionar coluna
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agendamentos' AND column_name = 'filial_id'
    ) THEN
        ALTER TABLE agendamentos ADD COLUMN filial_id BIGINT REFERENCES filiais(id);
        RAISE NOTICE 'Adicionada coluna filial_id em agendamentos';
    END IF;
END $$;

-- Atualizar agendamentos: cidade_id -> filial_id
UPDATE agendamentos 
SET filial_id = m.filial_id
FROM cidade_filial_map m
WHERE agendamentos.cidade_id::text = m.cidade_id::text
  AND agendamentos.filial_id IS NULL;

-- Atualizar clientes: manter cidade_id mas mapear para filial
DO $$
BEGIN
    -- Se clientes não tem filial_id, adicionar coluna
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' AND column_name = 'filial_id'
    ) THEN
        ALTER TABLE clientes ADD COLUMN filial_id BIGINT REFERENCES filiais(id);
        RAISE NOTICE 'Adicionada coluna filial_id em clientes';
    END IF;
END $$;

-- Atualizar filial_id em clientes
UPDATE clientes 
SET filial_id = m.filial_id
FROM cidade_filial_map m
WHERE clientes.cidade_id::text = m.cidade_id::text
  AND clientes.filial_id IS NULL;

-- Atualizar datas_disponiveis
DO $$
BEGIN
    -- Se não tem filial_id, adicionar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' AND column_name = 'filial_id'
    ) THEN
        ALTER TABLE datas_disponiveis ADD COLUMN filial_id BIGINT REFERENCES filiais(id);
        RAISE NOTICE 'Adicionada coluna filial_id em datas_disponiveis';
    END IF;
END $$;

UPDATE datas_disponiveis 
SET filial_id = m.filial_id
FROM cidade_filial_map m
WHERE datas_disponiveis.cidade_id::text = m.cidade_id::text
  AND datas_disponiveis.filial_id IS NULL;

-- Atualizar configuracoes_horarios
DO $$
BEGIN
    -- Se não tem filial_id, adicionar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'configuracoes_horarios' AND column_name = 'filial_id'
    ) THEN
        ALTER TABLE configuracoes_horarios ADD COLUMN filial_id BIGINT REFERENCES filiais(id);
        RAISE NOTICE 'Adicionada coluna filial_id em configuracoes_horarios';
    END IF;
END $$;

UPDATE configuracoes_horarios 
SET filial_id = m.filial_id
FROM cidade_filial_map m
WHERE configuracoes_horarios.cidade_id::text = m.cidade_id::text
  AND configuracoes_horarios.filial_id IS NULL;

-- =============================================
-- PASSO 4: VERIFICAR RESULTADO
-- =============================================

SELECT 
    'APÓS MIGRAÇÃO:' as status,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name IN ('id', 'cidade_id', 'filial_id')
    AND table_name IN ('cidades', 'filiais', 'agendamentos', 'clientes', 'datas_disponiveis', 'configuracoes_horarios')
ORDER BY table_name, column_name;

-- Verificar dados migrados
SELECT 'FILIAIS CRIADAS:' as info, COUNT(*) as total FROM filiais;
SELECT 'AGENDAMENTOS COM FILIAL_ID:' as info, COUNT(*) as total FROM agendamentos WHERE filial_id IS NOT NULL;
SELECT 'CLIENTES COM FILIAL_ID:' as info, COUNT(*) as total FROM clientes WHERE filial_id IS NOT NULL;

SELECT '🎉 MIGRAÇÃO CONCLUÍDA!' as resultado;
SELECT '✅ Agora use FILIAIS ao invés de CIDADES' as instrucao;
SELECT '📝 Tabela CIDADES pode ser mantida para compatibilidade' as observacao;