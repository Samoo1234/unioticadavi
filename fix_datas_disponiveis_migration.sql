-- Script corrigido para migração da tabela datas_disponiveis
-- Primeiro, vamos verificar a estrutura dos dados

-- 1. Verificar estrutura atual
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'datas_disponiveis'
ORDER BY ordinal_position;

-- 2. Verificar dados existentes
SELECT 
    id,
    cidade_id,
    data,
    created_at
FROM datas_disponiveis 
LIMIT 5;

-- 3. Verificar estrutura da tabela filiais
SELECT id, nome FROM filiais ORDER BY id;

-- 4. Adicionar coluna filial_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'datas_disponiveis' 
        AND column_name = 'filial_id'
    ) THEN
        ALTER TABLE datas_disponiveis ADD COLUMN filial_id INTEGER;
    END IF;
END $$;

-- 5. Migração dos dados - Opção 1: Se cidade_id é um número sequencial
-- Descomente esta linha se cidade_id for um número que corresponde ao id da filial
-- UPDATE datas_disponiveis SET filial_id = CAST(cidade_id AS INTEGER) WHERE filial_id IS NULL;

-- 6. Migração dos dados - Opção 2: Mapear pela posição/ordem
-- Se não há correspondência direta, mapear para a primeira filial disponível
UPDATE datas_disponiveis 
SET filial_id = (
    SELECT MIN(id) FROM filiais
) 
WHERE filial_id IS NULL;

-- 7. Verificar resultado da migração
SELECT 
    dd.id,
    dd.cidade_id,
    dd.filial_id,
    dd.data,
    f.nome as filial_nome
FROM datas_disponiveis dd
LEFT JOIN filiais f ON f.id = dd.filial_id
ORDER BY dd.id
LIMIT 10;

-- 8. Adicionar constraint NOT NULL após verificar que todos os registros têm filial_id
ALTER TABLE datas_disponiveis 
ALTER COLUMN filial_id SET NOT NULL;

-- 9. Adicionar foreign key constraint
ALTER TABLE datas_disponiveis 
ADD CONSTRAINT fk_datas_disponiveis_filial 
FOREIGN KEY (filial_id) REFERENCES filiais(id);

-- 10. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_datas_disponiveis_filial_id ON datas_disponiveis(filial_id);