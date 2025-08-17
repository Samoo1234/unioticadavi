-- Verificar exatamente quais colunas existem na tabela titulos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'titulos'
ORDER BY ordinal_position;
