-- Remover coluna cidade_id da tabela agendamentos

-- 1. Verificar se a coluna existe
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
AND column_name = 'cidade_id';

-- 2. Remover constraint se existir
ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_cidade_id_fkey;

-- 3. Remover coluna se existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agendamentos' 
    AND column_name = 'cidade_id'
  ) THEN
    ALTER TABLE agendamentos DROP COLUMN cidade_id;
    RAISE NOTICE 'Coluna cidade_id removida da tabela agendamentos';
  ELSE
    RAISE NOTICE 'Coluna cidade_id não existe na tabela agendamentos';
  END IF;
END $$;

-- 4. Verificar estrutura final
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'agendamentos'
ORDER BY ordinal_position; 