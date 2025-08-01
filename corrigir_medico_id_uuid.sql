-- Script para corrigir o tipo da coluna medico_id para UUID

-- 1. Verificar o tipo atual da coluna medico_id
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'datas_disponiveis' 
  AND column_name = 'medico_id';

-- 2. Alterar o tipo da coluna medico_id para UUID
ALTER TABLE datas_disponiveis 
ALTER COLUMN medico_id TYPE UUID USING medico_id::UUID;

-- 3. Adicionar foreign key constraint
ALTER TABLE datas_disponiveis 
ADD CONSTRAINT datas_disponiveis_medico_id_fkey 
FOREIGN KEY (medico_id) REFERENCES medicos(id);

-- 4. Verificar o resultado
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'datas_disponiveis' 
  AND column_name = 'medico_id'; 