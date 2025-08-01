-- Script para adicionar coluna filial_id à tabela configuracoes_horarios
-- e migrar os dados de cidade_id para filial_id

-- 1. Adicionar a coluna filial_id (apenas se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'configuracoes_horarios' 
        AND column_name = 'filial_id'
    ) THEN
        ALTER TABLE configuracoes_horarios ADD COLUMN filial_id INTEGER;
    END IF;
END $$;

-- 2. Migrar os dados: convertendo cidade_id para filial_id
-- Mapear para a primeira filial disponível se não há correspondência direta
UPDATE configuracoes_horarios 
SET filial_id = (
    SELECT MIN(id) FROM filiais
) 
WHERE filial_id IS NULL;

-- Alternativa: Se cidade_id for um número que corresponde ao id da filial
-- UPDATE configuracoes_horarios 
-- SET filial_id = CAST(cidade_id AS INTEGER);

-- 3. Adicionar constraint NOT NULL após migração
ALTER TABLE configuracoes_horarios 
ALTER COLUMN filial_id SET NOT NULL;

-- 4. Adicionar foreign key constraint
ALTER TABLE configuracoes_horarios 
ADD CONSTRAINT fk_configuracoes_horarios_filial 
FOREIGN KEY (filial_id) REFERENCES filiais(id);

-- 5. Criar índice para performance
CREATE INDEX idx_configuracoes_horarios_filial_id ON configuracoes_horarios(filial_id);

-- Verificar os dados após migração
SELECT 
    ch.id,
    ch.cidade_id,
    ch.filial_id,
    ch.horario_inicio,
    ch.horario_fim,
    f.nome as filial_nome
FROM configuracoes_horarios ch
LEFT JOIN filiais f ON f.id = ch.filial_id
ORDER BY ch.id;

-- Opcional: Após confirmar que a migração funcionou,
-- você pode remover a coluna cidade_id (descomente as linhas abaixo)
-- ALTER TABLE configuracoes_horarios DROP COLUMN cidade_id;