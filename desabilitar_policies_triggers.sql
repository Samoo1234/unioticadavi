-- Desabilitar temporariamente policies e triggers da tabela agendamentos

-- 1. Desabilitar RLS na tabela agendamentos
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as policies da tabela agendamentos
DROP POLICY IF EXISTS "Enable read access for all users" ON agendamentos;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON agendamentos;
DROP POLICY IF EXISTS "Enable update for users based on email" ON agendamentos;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON agendamentos;

-- 3. Listar e remover todos os triggers da tabela agendamentos
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'agendamentos'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON agendamentos';
        RAISE NOTICE 'Trigger removido: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- 4. Verificar se ainda há policies ou triggers
SELECT 'POLICIES RESTANTES:' as info;
SELECT policyname FROM pg_policies WHERE tablename = 'agendamentos';

SELECT 'TRIGGERS RESTANTES:' as info;
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'agendamentos';

-- 5. Verificar estrutura final da tabela
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'agendamentos'
ORDER BY ordinal_position; 