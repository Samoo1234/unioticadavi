-- Verificar triggers e policies que podem estar usando cidade_id

-- 1. Verificar triggers na tabela agendamentos
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'agendamentos';

-- 2. Verificar RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'agendamentos';

-- 3. Verificar se há alguma função que usa cidade_id
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%cidade_id%'
AND routine_schema = 'public';

-- 4. Verificar se há alguma view que usa cidade_id
SELECT 
  table_name,
  view_definition
FROM information_schema.views 
WHERE view_definition LIKE '%cidade_id%'
AND table_schema = 'public'; 