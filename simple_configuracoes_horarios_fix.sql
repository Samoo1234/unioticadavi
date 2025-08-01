-- Script simples para corrigir configuracoes_horarios
-- Apenas popula filial_id se estiver NULL

-- 1. Verificar estrutura atual (sem assumir colunas específicas)
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'configuracoes_horarios'
ORDER BY ordinal_position;

-- 2. Verificar se existem registros com filial_id NULL
SELECT COUNT(*) as registros_sem_filial
FROM configuracoes_horarios 
WHERE filial_id IS NULL;

-- 3. Verificar filiais disponíveis
SELECT id, nome FROM filiais ORDER BY id;

-- 4. Atualizar registros com filial_id NULL
UPDATE configuracoes_horarios 
SET filial_id = (
    SELECT MIN(id) FROM filiais
) 
WHERE filial_id IS NULL;

-- 5. Verificar resultado
SELECT 
    ch.id,
    ch.filial_id,
    f.nome as filial_nome
FROM configuracoes_horarios ch
LEFT JOIN filiais f ON f.id = ch.filial_id
ORDER BY ch.id;

-- 6. Adicionar constraint NOT NULL se necessário
ALTER TABLE configuracoes_horarios 
ALTER COLUMN filial_id SET NOT NULL;

-- 7. Adicionar foreign key se não existir
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