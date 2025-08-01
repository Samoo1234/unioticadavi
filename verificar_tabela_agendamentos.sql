-- Verificar estrutura da tabela agendamentos

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'agendamentos'
) as tabela_existe;

-- 2. Verificar estrutura atual da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'agendamentos'
ORDER BY ordinal_position;

-- 3. Verificar dados existentes (se houver)
SELECT * FROM agendamentos LIMIT 5; 