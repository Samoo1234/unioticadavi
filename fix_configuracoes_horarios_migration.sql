-- Script para corrigir migração da tabela configuracoes_horarios
-- A coluna filial_id já existe, então vamos apenas migrar os dados

-- 1. Verificar estrutura atual
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'configuracoes_horarios'
ORDER BY ordinal_position;

-- 2. Verificar dados existentes
SELECT 
    id,
    filial_id,
    horario_inicio,
    horario_fim
FROM configuracoes_horarios 
LIMIT 5;

-- 3. Verificar estrutura da tabela filiais
SELECT id, nome FROM filiais ORDER BY id;

-- 4. Migrar os dados apenas se filial_id estiver NULL
-- Mapear para a primeira filial disponível
UPDATE configuracoes_horarios 
SET filial_id = (
    SELECT MIN(id) FROM filiais
) 
WHERE filial_id IS NULL;

-- 5. Verificar resultado da migração
SELECT 
    ch.id,
    ch.filial_id,
    ch.horario_inicio,
    ch.horario_fim,
    f.nome as filial_nome
FROM configuracoes_horarios ch
LEFT JOIN filiais f ON f.id = ch.filial_id
ORDER BY ch.id;

-- 6. Adicionar constraint NOT NULL se ainda não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'configuracoes_horarios' 
        AND ccu.column_name = 'filial_id'
        AND tc.constraint_type = 'NOT NULL'
    ) THEN
        ALTER TABLE configuracoes_horarios ALTER COLUMN filial_id SET NOT NULL;
    END IF;
END $$;

-- 7. Adicionar foreign key constraint se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_configuracoes_horarios_filial'
    ) THEN
        ALTER TABLE configuracoes_horarios 
        ADD CONSTRAINT fk_configuracoes_horarios_filial 
        FOREIGN KEY (filial_id) REFERENCES filiais(id);
    END IF;
END $$;

-- 8. Criar índice se não existir
CREATE INDEX IF NOT EXISTS idx_configuracoes_horarios_filial_id ON configuracoes_horarios(filial_id);