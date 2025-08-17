-- Script para verificar a estrutura atual da tabela titulos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'titulos'
ORDER BY ordinal_position;

-- Verificar alguns registros da tabela para entender os dados existentes
SELECT *
FROM titulos
LIMIT 5;

-- Verificar as políticas RLS na tabela
SELECT *
FROM pg_policies
WHERE tablename = 'titulos';

-- Verificar os triggers na tabela
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'titulos';

-- Verificar todos os campos de data na tabela
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'titulos' 
  AND (data_type LIKE '%timestamp%' OR data_type LIKE '%date%');

-- Buscar o nome correto dos campos de data
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'titulos' 
  AND column_name LIKE '%data%' 
  OR column_name LIKE '%date%';
