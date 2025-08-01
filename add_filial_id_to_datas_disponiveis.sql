-- Script para adicionar coluna filial_id à tabela datas_disponiveis
-- e migrar os dados de cidade_id para filial_id

-- 1. Adicionar a coluna filial_id
ALTER TABLE datas_disponiveis 
ADD COLUMN filial_id INTEGER;

-- 2. Migrar os dados: convertendo cidade_id (uuid) para filial_id (integer)
-- Assumindo que existe uma correspondência entre cidades e filiais
UPDATE datas_disponiveis 
SET filial_id = (
    SELECT f.id 
    FROM filiais f 
    WHERE f.id::text = datas_disponiveis.cidade_id::text
    LIMIT 1
);

-- Alternativa: Se cidade_id for sequencial e corresponder diretamente ao id da filial
-- UPDATE datas_disponiveis 
-- SET filial_id = CAST(cidade_id AS INTEGER);

-- 3. Adicionar constraint NOT NULL após migração
ALTER TABLE datas_disponiveis 
ALTER COLUMN filial_id SET NOT NULL;

-- 4. Adicionar foreign key constraint
ALTER TABLE datas_disponiveis 
ADD CONSTRAINT fk_datas_disponiveis_filial 
FOREIGN KEY (filial_id) REFERENCES filiais(id);

-- 5. Criar índice para performance
CREATE INDEX idx_datas_disponiveis_filial_id ON datas_disponiveis(filial_id);

-- Verificar os dados após migração
SELECT 
    dd.id,
    dd.data,
    dd.cidade_id,
    dd.filial_id,
    f.nome as filial_nome
FROM datas_disponiveis dd
LEFT JOIN filiais f ON f.id = dd.filial_id
ORDER BY dd.id
LIMIT 10;

-- Opcional: Após confirmar que a migração funcionou,
-- você pode remover a coluna cidade_id (descomente as linhas abaixo)
-- ALTER TABLE datas_disponiveis DROP COLUMN cidade_id;