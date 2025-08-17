-- Verificar a estrutura atual da tabela titulos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'titulos'
ORDER BY ordinal_position;

-- Verificar alguns registros da tabela para entender os dados
SELECT *
FROM titulos
LIMIT 5;
